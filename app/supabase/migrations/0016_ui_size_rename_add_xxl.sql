-- Issue #52: rename ui_size tiers (regular/large/xlarge -> small/medium/xl),
-- add xxl, and shift default to medium for new profiles.

alter table public.profiles drop constraint profiles_ui_size_check;

alter table public.profiles alter column ui_size drop default;

update public.profiles
  set ui_size = case ui_size
    when 'regular' then 'small'
    when 'large'   then 'medium'
    when 'xlarge'  then 'xl'
    else ui_size
  end;

alter table public.profiles alter column ui_size set default 'medium';

alter table public.profiles
  add constraint profiles_ui_size_check
  check (ui_size in ('small', 'medium', 'xl', 'xxl'));
