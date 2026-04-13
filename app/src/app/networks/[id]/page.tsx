import { createSupabaseServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import {
  renameNetworkAction,
  deleteNetworkAction,
  leaveNetworkAction,
  removeMemberAction,
} from '@/app/actions/networks'

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
    .order('role', { ascending: false }) // 'owner' before 'member'

  const members = (membersRaw ?? []) as unknown as MemberRow[]
  const isOwner = network.owner_id === user!.id

  return (
    <main>
      <nav>
        <a href="/networks">← Networks</a>
      </nav>

      <h1>{network.name}</h1>

      {isOwner && (
        <section>
          <h2>Rename</h2>
          <form action={renameNetworkAction}>
            <input type="hidden" name="network_id" value={id} />
            <label htmlFor="rename-input">New name</label>
            <input
              id="rename-input"
              name="name"
              type="text"
              defaultValue={network.name}
              required
              suppressHydrationWarning
            />
            <button type="submit">Save</button>
          </form>
        </section>
      )}

      <section>
        <h2>Members</h2>
        <ul>
          {members.map((m) => (
            <li key={m.user_id}>
              <span>{m.profiles?.username ?? m.user_id}</span>
              <span> — {m.role}</span>
              {isOwner && m.user_id !== user!.id && (
                <form action={removeMemberAction} style={{ display: 'inline', marginLeft: '0.5rem' }}>
                  <input type="hidden" name="network_id" value={id} />
                  <input type="hidden" name="user_id" value={m.user_id} />
                  <button type="submit">Remove</button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        {isOwner ? (
          <form action={deleteNetworkAction}>
            <input type="hidden" name="network_id" value={id} />
            <button type="submit">Delete Network</button>
          </form>
        ) : (
          <form action={leaveNetworkAction}>
            <input type="hidden" name="network_id" value={id} />
            <button type="submit">Leave Network</button>
          </form>
        )}
      </section>
    </main>
  )
}
