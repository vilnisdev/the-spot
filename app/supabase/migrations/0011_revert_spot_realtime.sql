-- Revert live-pin realtime attempt (issues from 0009 + 0010).
--
-- 0010 introduced infinite recursion: removing SECURITY DEFINER from
-- create_spot/update_spot caused the spot_networks RLS policies to query
-- spots, which queries spot_networks again → infinite loop.
-- Restore SECURITY DEFINER on both RPCs and the original spots_select policy.
--
-- Also remove spots and spot_networks from the realtime publication added in
-- 0009 — they are no longer subscribed to. Comments remain in the publication.

-- 1. Restore original spots_select (remove the auth.uid() = author_id branch)
DROP POLICY IF EXISTS "spots_select" ON public.spots;
CREATE POLICY "spots_select" ON public.spots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.spot_networks sn
      WHERE sn.spot_id = spots.id
        AND public.is_network_member(sn.network_id)
    )
  );

-- 2. Restore create_spot with SECURITY DEFINER
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
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

-- 3. Restore update_spot with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.update_spot(
  p_spot_id     uuid,
  p_title       text,
  p_description text,
  p_date        date,
  p_network_ids uuid[],
  p_tag_names   text[] DEFAULT '{}'
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

-- 4. Remove spots and spot_networks from realtime publication (no longer used)
ALTER PUBLICATION supabase_realtime DROP TABLE public.spot_networks;
ALTER PUBLICATION supabase_realtime DROP TABLE public.spots;
