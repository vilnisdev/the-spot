-- Issue #53: favorite spot — per-user global favorite that the map centers on
alter table public.profiles
  add column favorite_spot_id uuid null
  references public.spots(id) on delete set null;
