-- Issue #16: dark/light mode toggle — persist user's theme preference
alter table public.profiles
  add column theme_preference text not null default 'system'
  check (theme_preference in ('light', 'dark', 'system'));
