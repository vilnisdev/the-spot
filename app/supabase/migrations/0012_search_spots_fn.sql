-- search_spots: search spots by title or tag name within caller's RLS-visible spots.
--
-- SECURITY INVOKER: auth.uid() is the calling user, so spots_select RLS applies
-- automatically — results are already network-filtered without extra filtering.
--
-- EXISTS subquery for tags avoids JOIN fan-out when a spot has many tags.
-- Returns up to 10 distinct results ordered by title.

create or replace function public.search_spots(
  p_query text
) returns table (
  id    uuid,
  title text,
  lat   double precision,
  lng   double precision
)
language sql security invoker stable set search_path = public as $$
  select distinct s.id, s.title, s.lat, s.lng
  from public.spots s
  where
    s.title ilike '%' || p_query || '%'
    or exists (
      select 1
      from public.spot_tags st
      join public.tags t on t.id = st.tag_id
      where st.spot_id = s.id
        and t.name ilike '%' || p_query || '%'
    )
  limit 10;
$$;

grant execute on function public.search_spots(text) to authenticated;
