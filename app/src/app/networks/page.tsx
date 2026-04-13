import { createSupabaseServerClient } from '@/lib/supabase/server'
import CreateNetworkForm from './create-network-form'

export default async function NetworksPage() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: networks } = await supabase
    .from('networks')
    .select('id, name, owner_id')
    .order('created_at', { ascending: false })

  return (
    <main>
      <header>
        <a href="/">← Home</a>
        <h1>Networks</h1>
      </header>

      <section>
        <h2>Create a Network</h2>
        <CreateNetworkForm />
      </section>

      <section>
        <h2>Your Networks</h2>
        {networks && networks.length > 0 ? (
          <ul>
            {networks.map((n) => (
              <li key={n.id}>
                <a href={`/networks/${n.id}`}>{n.name}</a>
                {n.owner_id === user!.id && <span> (owner)</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p>No networks yet. Create one above.</p>
        )}
      </section>
    </main>
  )
}
