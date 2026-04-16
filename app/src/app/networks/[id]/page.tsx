import { createSupabaseServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import {
  renameNetworkAction,
  deleteNetworkAction,
  leaveNetworkAction,
  removeMemberAction,
} from '@/app/actions/networks'
import { revokeInvitationAction } from '@/app/actions/invitations'
import PageNav from '@/components/shared/PageNav'
import GenerateInviteForm from './generate-invite-form'
import styles from './networkDetail.module.css'

interface Props {
  params: Promise<{ id: string }>
}

// PostgREST returns a single object for many-to-one FK joins at runtime.
// TypeScript infers array without generated types — cast via unknown below.
type MemberRow = {
  role: string
  user_id: string
  profiles: { username: string } | null
}

export default async function NetworkDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: network } = await supabase
    .from('networks')
    .select('id, name, owner_id')
    .eq('id', id)
    .single()

  if (!network) notFound()

  const { data: membersRaw } = await supabase
    .from('memberships')
    .select('role, user_id, profiles(username)')
    .eq('network_id', id)
    .order('role', { ascending: false })

  const { data: activeInvitations } = await supabase
    .from('invitations')
    .select('id, token, expires_at, created_at')
    .eq('network_id', id)
    .gt('expires_at', new Date().toISOString())
    .is('revoked_at', null)
    .order('created_at', { ascending: false })

  const members = (membersRaw ?? []) as unknown as MemberRow[]
  const isOwner = network.owner_id === user!.id

  return (
    <div className={styles.page}>
      <PageNav />

      <header className={styles.header}>
        <h1 className={styles.title}>{network.name}</h1>
        <p className={styles.subtitle}>
          {members.length} member{members.length === 1 ? '' : 's'}
        </p>
      </header>

      {isOwner && (
        <section className={styles.section}>
          <form action={renameNetworkAction}>
            <input type="hidden" name="network_id" value={id} />
            <input
              id="rename-input"
              name="name"
              type="text"
              defaultValue={network.name}
              required
              className={styles.input}
              suppressHydrationWarning
            />
            <button type="submit" className={styles.saveBtn}>Save</button>
          </form>
        </section>
      )}

      <section className={styles.section}>
        <GenerateInviteForm networkId={id} />
        {isOwner && activeInvitations && activeInvitations.length > 0 && (
          <ul className={styles.inviteList}>
            {activeInvitations.map((inv) => (
              <li key={inv.id} className={styles.inviteItem}>
                <span className={styles.inviteExpiry}>
                  Expires {new Date(inv.expires_at).toLocaleDateString()}
                </span>
                <form action={revokeInvitationAction} className={styles.inlineForm}>
                  <input type="hidden" name="invitation_id" value={inv.id} />
                  <input type="hidden" name="network_id" value={id} />
                  <button type="submit" className={styles.inlineBtn}>Revoke</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section}>
        <p className={styles.sectionLabel}>Members</p>
        {members.length > 0 ? (
          <ul className={styles.memberList}>
            {members.map((m) => (
              <li key={m.user_id} className={styles.memberItem}>
                <span className={styles.memberName}>{m.profiles?.username ?? m.user_id}</span>
                <span className={styles.memberRole}>{m.role}</span>
                {isOwner && m.user_id !== user!.id && (
                  <form action={removeMemberAction} className={styles.inlineForm}>
                    <input type="hidden" name="network_id" value={id} />
                    <input type="hidden" name="user_id" value={m.user_id} />
                    <button type="submit" className={styles.inlineBtn}>Remove</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptyState}>No members yet.</p>
        )}
      </section>

      <section className={styles.dangerSection}>
        {isOwner ? (
          <form action={deleteNetworkAction}>
            <input type="hidden" name="network_id" value={id} />
            <button type="submit" className={styles.dangerBtn}>Delete Network</button>
          </form>
        ) : (
          <form action={leaveNetworkAction}>
            <input type="hidden" name="network_id" value={id} />
            <button type="submit" className={styles.leaveBtn}>Leave Network</button>
          </form>
        )}
      </section>
    </div>
  )
}
