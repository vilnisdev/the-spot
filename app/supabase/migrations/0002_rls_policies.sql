-- Security-definer helpers: bypass RLS on memberships to avoid infinite recursion.
-- Any policy that needs to check membership must use these functions, not JOIN memberships directly.
create or replace function public.is_network_member(p_network_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from memberships
    where network_id = p_network_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_network_owner(p_network_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from memberships
    where network_id = p_network_id and user_id = auth.uid() and role = 'owner'
  );
$$;

-- Enable RLS on all public tables
alter table public.profiles enable row level security;
alter table public.networks enable row level security;
alter table public.memberships enable row level security;
alter table public.spots enable row level security;
alter table public.spot_networks enable row level security;
alter table public.tags enable row level security;
alter table public.spot_tags enable row level security;
alter table public.comments enable row level security;
alter table public.media enable row level security;
alter table public.invitations enable row level security;

-- profiles
create policy "profiles_select" on public.profiles
  for select using (true);
create policy "profiles_insert" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles
  for update using (auth.uid() = id);

-- networks
create policy "networks_select" on public.networks
  for select using (public.is_network_member(id));
create policy "networks_insert" on public.networks
  for insert with check (auth.uid() = owner_id);
create policy "networks_update" on public.networks
  for update using (auth.uid() = owner_id);
create policy "networks_delete" on public.networks
  for delete using (auth.uid() = owner_id);

-- memberships (uses security definer helpers to avoid self-referential recursion)
create policy "memberships_select" on public.memberships
  for select using (public.is_network_member(network_id));
create policy "memberships_insert" on public.memberships
  for insert with check (auth.uid() = user_id);
create policy "memberships_delete" on public.memberships
  for delete using (
    auth.uid() = user_id
    or public.is_network_owner(network_id)
  );

-- spots
create policy "spots_select" on public.spots
  for select using (
    exists (
      select 1 from public.spot_networks sn
      where sn.spot_id = spots.id
        and public.is_network_member(sn.network_id)
    )
  );
create policy "spots_insert" on public.spots
  for insert with check (auth.uid() = author_id);
create policy "spots_update" on public.spots
  for update using (auth.uid() = author_id);
create policy "spots_delete" on public.spots
  for delete using (auth.uid() = author_id);

-- spot_networks
create policy "spot_networks_select" on public.spot_networks
  for select using (public.is_network_member(network_id));
create policy "spot_networks_insert" on public.spot_networks
  for insert with check (
    exists (
      select 1 from public.spots s
      where s.id = spot_networks.spot_id
        and s.author_id = auth.uid()
    )
  );
create policy "spot_networks_delete" on public.spot_networks
  for delete using (
    exists (
      select 1 from public.spots s
      where s.id = spot_networks.spot_id
        and s.author_id = auth.uid()
    )
  );

-- tags
create policy "tags_select" on public.tags
  for select using (true);
create policy "tags_insert" on public.tags
  for insert with check (auth.uid() is not null);

-- spot_tags
create policy "spot_tags_select" on public.spot_tags
  for select using (
    exists (
      select 1 from public.spot_networks sn
      where sn.spot_id = spot_tags.spot_id
        and public.is_network_member(sn.network_id)
    )
  );
create policy "spot_tags_insert" on public.spot_tags
  for insert with check (
    exists (
      select 1 from public.spots s
      where s.id = spot_tags.spot_id
        and s.author_id = auth.uid()
    )
  );
create policy "spot_tags_delete" on public.spot_tags
  for delete using (
    exists (
      select 1 from public.spots s
      where s.id = spot_tags.spot_id
        and s.author_id = auth.uid()
    )
  );

-- comments
create policy "comments_select" on public.comments
  for select using (
    exists (
      select 1 from public.spot_networks sn
      where sn.spot_id = comments.spot_id
        and public.is_network_member(sn.network_id)
    )
  );
create policy "comments_insert" on public.comments
  for insert with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.spot_networks sn
      where sn.spot_id = comments.spot_id
        and public.is_network_member(sn.network_id)
    )
  );
create policy "comments_delete" on public.comments
  for delete using (auth.uid() = author_id);

-- media
create policy "media_select" on public.media
  for select using (
    exists (
      select 1 from public.spot_networks sn
      where sn.spot_id = media.spot_id
        and public.is_network_member(sn.network_id)
    )
  );
create policy "media_insert" on public.media
  for insert with check (
    exists (
      select 1 from public.spots s
      where s.id = media.spot_id
        and s.author_id = auth.uid()
    )
  );
create policy "media_delete" on public.media
  for delete using (
    exists (
      select 1 from public.spots s
      where s.id = media.spot_id
        and s.author_id = auth.uid()
    )
  );

-- invitations
create policy "invitations_select" on public.invitations
  for select using (public.is_network_member(network_id));
create policy "invitations_insert" on public.invitations
  for insert with check (
    auth.uid() = created_by
    and public.is_network_member(network_id)
  );
create policy "invitations_update" on public.invitations
  for update using (public.is_network_owner(network_id));
