import { createSupabaseServerClient } from '@/lib/supabase/server'
import PageNav from '@/components/shared/PageNav'
import CreateNetworkForm from './create-network-form'
import styles from './networks.module.css'

export default async function NetworksPage() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: networks } = await supabase
    .from('networks')
    .select('id, name, owner_id')
    .order('created_at', { ascending: false })

  const count = networks?.length ?? 0

  return (
    <div className={styles.page}>
      <PageNav />

      <header className={styles.header}>
        <h1 className={styles.title}>Networks</h1>
        <p className={styles.subtitle}>
          {count === 0 ? 'No networks yet' : `${count} network${count === 1 ? '' : 's'}`}
        </p>
      </header>

      <section className={styles.section}>
        <CreateNetworkForm />
      </section>

      <section className={styles.section}>
        <p className={styles.sectionLabel}>Your Networks</p>
        {networks && networks.length > 0 ? (
          <ul className={styles.networkList}>
            {networks.map((n) => (
              <li key={n.id} className={styles.networkItem}>
                <a href={`/networks/${n.id}`} className={styles.networkLink}>{n.name}</a>
                {n.owner_id === user!.id && <span className={styles.ownerBadge}>owner</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptyState}>No networks yet. Create one above.</p>
        )}
      </section>
    </div>
  )
}
