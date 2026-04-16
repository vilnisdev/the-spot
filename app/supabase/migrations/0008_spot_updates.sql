-- Add filename column to media (nullable for back-compat with existing rows)
ALTER TABLE public.media ADD COLUMN name text;

-- Atomic spot update RPC (mirrors create_spot structure)
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

  -- Re-sync tags
  DELETE FROM spot_tags WHERE spot_id = p_spot_id;
  FOREACH v_tag IN ARRAY COALESCE(p_tag_names, '{}') LOOP
    INSERT INTO tags (name) VALUES (v_tag) ON CONFLICT (name) DO NOTHING;
    SELECT id INTO v_tag_id FROM tags WHERE name = v_tag;
    INSERT INTO spot_tags (spot_id, tag_id) VALUES (p_spot_id, v_tag_id) ON CONFLICT DO NOTHING;
  END LOOP;

  -- Re-sync networks (only if caller provides at least one)
  IF array_length(p_network_ids, 1) > 0 THEN
    DELETE FROM spot_networks WHERE spot_id = p_spot_id;
    INSERT INTO spot_networks (spot_id, network_id) SELECT p_spot_id, unnest(p_network_ids);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_spot(uuid, text, text, date, uuid[], text[]) TO authenticated;
