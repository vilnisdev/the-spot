-- Fix Supabase Realtime live-pin delivery (issue #11).
--
-- Root cause: create_spot and update_spot used SECURITY DEFINER, so their
-- inserts ran as the postgres superuser.  Supabase Realtime only forwards
-- postgres_changes events made by the `authenticated` / `anon` role — changes
-- by `postgres` are not forwarded to subscribers, so new pins never appeared
-- in real-time for other users.
--
-- The bootstrapping problem that originally required SECURITY DEFINER:
--   spots_select requires a spot_networks row to exist before the spot is
--   readable, but spot_networks_insert checks spots.author_id via a subquery
--   that goes through spots_select → deadlock for a brand-new spot.
--
-- Fix: add `auth.uid() = author_id` to spots_select so authors can always
-- read their own spots.  This breaks the cycle and lets both RPCs run as
-- SECURITY INVOKER (the calling authenticated user).

-- 1. Extend spots_select so authors can always read their own spots
DROP POLICY IF EXISTS "spots_select" ON public.spots;
CREATE POLICY "spots_select" ON public.spots
  FOR SELECT USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM public.spot_networks sn
      WHERE sn.spot_id = spots.id
        AND public.is_network_member(sn.network_id)
    )
  );

-- 2. Recreate create_spot as SECURITY INVOKER
--    (SECURITY INVOKER is the default; omitting the clause is equivalent)
CREATE OR REPLACE FUNCTION public.create_spot(
  p_title       text,
  p_description text,
  p_lat         double precision,
  p_lng         double precision,
  p_state       text,
  p_date        date,
  p_network_ids uuid[],
  p_tag_names   text[] DEFAULT '{}'
) RETURNS uuid
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_spot_id uuid;
  v_tag_id  uuid;
  v_tag     text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF array_length(p_network_ids, 1) IS NULL OR array_length(p_network_ids, 1) = 0 THEN
    RAISE EXCEPTION 'At least one network is required';
  END IF;

  INSERT INTO public.spots (author_id, title, description, lat, lng, state, date)
  VALUES (auth.uid(), p_title, p_description, p_lat, p_lng, p_state, p_date)
  RETURNING id INTO v_spot_id;

  INSERT INTO public.spot_networks (spot_id, network_id)
  SELECT v_spot_id, unnest(p_network_ids);

  FOREACH v_tag IN ARRAY COALESCE(p_tag_names, '{}') LOOP
    INSERT INTO public.tags (name) VALUES (v_tag) ON CONFLICT (name) DO NOTHING;
    SELECT id INTO v_tag_id FROM public.tags WHERE name = v_tag;
    INSERT INTO public.spot_tags (spot_id, tag_id)
    VALUES (v_spot_id, v_tag_id) ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN v_spot_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_spot(text, text, double precision, double precision, text, date, uuid[], text[]) TO authenticated;

-- 3. Recreate update_spot as SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.update_spot(
  p_spot_id     uuid,
  p_title       text,
  p_description text,
  p_date        date,
  p_network_ids uuid[],
  p_tag_names   text[] DEFAULT '{}'
) RETURNS void
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_tag_id uuid;
  v_tag    text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT EXISTS (SELECT 1 FROM spots WHERE id = p_spot_id AND author_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE spots SET title = p_title, description = p_description, date = p_date
  WHERE id = p_spot_id;

  DELETE FROM spot_tags WHERE spot_id = p_spot_id;
  FOREACH v_tag IN ARRAY COALESCE(p_tag_names, '{}') LOOP
    INSERT INTO tags (name) VALUES (v_tag) ON CONFLICT (name) DO NOTHING;
    SELECT id INTO v_tag_id FROM tags WHERE name = v_tag;
    INSERT INTO spot_tags (spot_id, tag_id) VALUES (p_spot_id, v_tag_id) ON CONFLICT DO NOTHING;
  END LOOP;

  IF array_length(p_network_ids, 1) > 0 THEN
    DELETE FROM spot_networks WHERE spot_id = p_spot_id;
    INSERT INTO spot_networks (spot_id, network_id) SELECT p_spot_id, unnest(p_network_ids);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_spot(uuid, text, text, date, uuid[], text[]) TO authenticated;
