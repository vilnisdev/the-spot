import { createSupabaseServerClient } from '@/lib/supabase/server'
import MapPage from '@/components/map/MapPage'
import LandingPage from '@/components/landing/LandingPage'
import { getMapSpotsAction } from '@/app/actions/spots'

interface HomeProps {
  searchParams: Promise<{ spot?: string }>
}

export default async function Home({ searchParams }: HomeProps) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <LandingPage />
  }

  const { spot } = await searchParams

  const [mapResult, { data: networks }] = await Promise.all([
    getMapSpotsAction(),
    supabase.from('networks').select('id, name').order('name'),
  ])

  return (
    <main style={{ height: '100vh', overflow: 'hidden' }}>
      <MapPage
        spots={mapResult.spots}
        networks={networks ?? []}
        userId={user.id}
        initialSpotId={spot ?? null}
        favoriteSpot={mapResult.favoriteSpot}
      />
    </main>
  )
}
