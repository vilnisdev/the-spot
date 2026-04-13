-- Atomic network creation: inserts network + owner membership in one call.
-- Needed because networks_select RLS uses is_network_member(id), so the
-- creator cannot SELECT the row they just inserted until membership exists.
create or replace function public.create_network(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_network_id uuid;
begin
  insert into public.networks (name, owner_id)
  values (p_name, auth.uid())
  returning id into v_network_id;

  insert into public.memberships (user_id, network_id, role)
  values (auth.uid(), v_network_id, 'owner');

  return v_network_id;
end;
$$;

-- Revoke public execute, grant to authenticated only
revoke execute on function public.create_network(text) from public;
grant execute on function public.create_network(text) to authenticated;
