-- Extract spot_id from storage object name: "{spot_id}/{filename}"
create or replace function public.storage_spot_id(obj_name text)
returns uuid language sql immutable set search_path = public as $$
  select (split_part(obj_name, '/', 1))::uuid;
$$;

-- storage.objects policies for media bucket
-- SELECT: network members can download media for spots in their networks
create policy "media_objects_select" on storage.objects
  for select using (
    bucket_id = 'media'
    and exists (
      select 1 from public.spot_networks sn
      where sn.spot_id = public.storage_spot_id(name)
        and public.is_network_member(sn.network_id)
    )
  );

-- INSERT: spot author can upload media for their spot
create policy "media_objects_insert" on storage.objects
  for insert with check (
    bucket_id = 'media'
    and exists (
      select 1 from public.spots s
      where s.id = public.storage_spot_id(name)
        and s.author_id = auth.uid()
    )
  );

-- DELETE: spot author can remove their media
create policy "media_objects_delete" on storage.objects
  for delete using (
    bucket_id = 'media'
    and exists (
      select 1 from public.spots s
      where s.id = public.storage_spot_id(name)
        and s.author_id = auth.uid()
    )
  );
