-- profiles: mirrors auth.users; auto-created on user registration via trigger
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  last_seen_at timestamptz default now()
);

-- auto-create profile row when auth user is created
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- networks
create table public.networks (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now()
);

-- memberships (owner or member)
create table public.memberships (
  user_id uuid references public.profiles(id) on delete cascade,
  network_id uuid references public.networks(id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  joined_at timestamptz default now(),
  primary key (user_id, network_id)
);

-- spots
create table public.spots (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  lat double precision not null,
  lng double precision not null,
  state text,
  date date not null default current_date,
  created_at timestamptz default now()
);

-- spot_networks (many-to-many: a spot may belong to multiple networks)
create table public.spot_networks (
  spot_id uuid references public.spots(id) on delete cascade,
  network_id uuid references public.networks(id) on delete cascade,
  primary key (spot_id, network_id)
);

-- tags
create table public.tags (
  id uuid default gen_random_uuid() primary key,
  name text unique not null
);

-- spot_tags (many-to-many)
create table public.spot_tags (
  spot_id uuid references public.spots(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  primary key (spot_id, tag_id)
);

-- comments
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  spot_id uuid references public.spots(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null,
  created_at timestamptz default now()
);

-- media (images and audio only; video out of scope for v1)
create table public.media (
  id uuid default gen_random_uuid() primary key,
  spot_id uuid references public.spots(id) on delete cascade not null,
  url text not null,
  type text not null check (type in ('image', 'audio')),
  created_at timestamptz default now()
);

-- invitations (multi-use, 7-day expiry, revocable)
create table public.invitations (
  id uuid default gen_random_uuid() primary key,
  network_id uuid references public.networks(id) on delete cascade not null,
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  created_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  revoked_at timestamptz,
  created_at timestamptz default now()
);
