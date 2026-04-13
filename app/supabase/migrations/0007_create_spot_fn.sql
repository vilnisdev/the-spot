-- create_spot: atomic spot + spot_networks + spot_tags insert
--
-- SECURITY DEFINER is required because spot_networks_insert policy checks
-- spots.author_id via a subquery — which is blocked by spots_select RLS until
-- the spot has at least one network attached (bootstrapping problem).
-- Running as the function owner (superuser) bypasses that RLS cycle.
--
-- p_network_ids    — array of network UUIDs; at least one required
-- p_tag_names      — array of lowercase tag strings (extracted from description #words)
-- Returns the new spot's UUID.

create or replace function public.create_spot(
  p_title       text,
  p_description text,
  p_lat         double precision,
  p_lng         double precision,
  p_state       text,
  p_date        date,
  p_network_ids uuid[],
  p_tag_names   text[] default '{}'
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_spot_id uuid;
  v_tag_id  uuid;
  v_tag     text;
begin
  -- Verify caller is authenticated
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- Require at least one network
  if array_length(p_network_ids, 1) is null or array_length(p_network_ids, 1) = 0 then
    raise exception 'At least one network is required';
  end if;

  -- Insert spot
  insert into public.spots (author_id, title, description, lat, lng, state, date)
  values (auth.uid(), p_title, p_description, p_lat, p_lng, p_state, p_date)
  returning id into v_spot_id;

  -- Attach networks (no RLS concern inside security definer)
  insert into public.spot_networks (spot_id, network_id)
  select v_spot_id, unnest(p_network_ids);

  -- Upsert tags and attach spot_tags
  foreach v_tag in array coalesce(p_tag_names, '{}') loop
    insert into public.tags (name)
    values (v_tag)
    on conflict (name) do nothing;

    select id into v_tag_id from public.tags where name = v_tag;

    insert into public.spot_tags (spot_id, tag_id)
    values (v_spot_id, v_tag_id)
    on conflict do nothing;
  end loop;

  return v_spot_id;
end;
$$;

-- Callers are authenticated users (anon cannot call this)
grant execute on function public.create_spot(text, text, double precision, double precision, text, date, uuid[], text[]) to authenticated;
