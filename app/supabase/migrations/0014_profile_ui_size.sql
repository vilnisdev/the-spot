-- Issue #42: UI size toggle — persist user's size preference
alter table public.profiles
  add column ui_size text not null default 'regular'
  check (ui_size in ('regular', 'large', 'xlarge'));
