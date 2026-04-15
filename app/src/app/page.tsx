import { createSupabaseServerClient } from '@/lib/supabase/server'
import MapPage from '@/components/map/MapPage'

interface HomeProps {
  searchParams: Promise<{ spot?: string }>
}

export default async function Home({ searchParams }: HomeProps) {
  const supabase = await createSupabaseServerClient()
  const { spot } = await searchParams

  const [{ data: spots }, { data: networks }, { data: { user } }] = await Promise.all([
    supabase.from('spots').select('id, title, lat, lng, spot_networks(network_id)'),
    supabase.from('networks').select('id, name').order('name'),
    supabase.auth.getUser(),
  ])

  return (
    <main style={{ height: '100vh', overflow: 'hidden' }}>
      <MapPage
        spots={spots ?? []}
        networks={networks ?? []}
        userId={user?.id ?? null}
        initialSpotId={spot ?? null}
      />
    </main>
  )
}
