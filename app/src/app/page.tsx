import { createSupabaseServerClient } from '@/lib/supabase/server'
import MapPage from '@/components/map/MapPage'

export default async function Home() {
  const supabase = await createSupabaseServerClient()

  const [{ data: spots }, { data: networks }] = await Promise.all([
    supabase.from('spots').select('id, title, lat, lng, spot_networks(network_id)'),
    supabase.from('networks').select('id, name').order('name'),
  ])

  return (
    <main style={{ height: '100vh', overflow: 'hidden' }}>
      <MapPage spots={spots ?? []} networks={networks ?? []} />
    </main>
  )
}
