-- lookup_invitation: publicly callable (anon) security-definer function.
-- Returns the network name and validity status for a given invite token.
-- No auth required — used by the /invite/[token] page before sign-in.
create or replace function public.lookup_invitation(p_token text)
returns table(network_id uuid, network_name text, status text)
language plpgsql security definer stable set search_path = public as $$
declare
  v_network_id uuid;
  v_network_name text;
  v_expires_at timestamptz;
  v_revoked_at timestamptz;
begin
  select i.network_id, n.name, i.expires_at, i.revoked_at
  into v_network_id, v_network_name, v_expires_at, v_revoked_at
  from invitations i
  join networks n on n.id = i.network_id
  where i.token = p_token;

  if not found then
    return query select null::uuid, null::text, 'not_found'::text;
    return;
  end if;

  if v_revoked_at is not null then
    return query select v_network_id, v_network_name, 'revoked'::text;
    return;
  end if;

  if v_expires_at < now() then
    return query select v_network_id, v_network_name, 'expired'::text;
    return;
  end if;

  return query select v_network_id, v_network_name, 'valid'::text;
end;
$$;

-- join_by_token: requires auth. Validates token and inserts membership.
-- Idempotent: ON CONFLICT DO NOTHING if already a member.
-- Returns the network_id on success; raises an exception on failure.
create or replace function public.join_by_token(p_token text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_network_id uuid;
  v_expires_at timestamptz;
  v_revoked_at timestamptz;
begin
  select network_id, expires_at, revoked_at
  into v_network_id, v_expires_at, v_revoked_at
  from invitations
  where token = p_token;

  if not found then
    raise exception 'Invitation not found.';
  end if;

  if v_revoked_at is not null then
    raise exception 'Invitation has been revoked.';
  end if;

  if v_expires_at < now() then
    raise exception 'Invitation has expired.';
  end if;

  insert into memberships (user_id, network_id, role)
  values (auth.uid(), v_network_id, 'member')
  on conflict (user_id, network_id) do nothing;

  return v_network_id;
end;
$$;
