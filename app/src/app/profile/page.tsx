import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getMySpotsAction } from '@/app/actions/spots'
import ProfilePage from '@/components/profile/ProfilePage'

export default async function ProfilePageRoute() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [spotsResult, networksResult] = await Promise.all([
    getMySpotsAction(),
    supabase.from('networks').select('id, name').order('name'),
  ])

  if ('error' in spotsResult) {
    return (
      <main>
        <p>Error loading profile: {spotsResult.error}</p>
      </main>
    )
  }

  return (
    <ProfilePage
      username={spotsResult.username}
      spots={spotsResult.spots}
      networks={networksResult.data ?? []}
    />
  )
}
