import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import SettingsPage from '@/components/settings/SettingsPage'

export default async function SettingsPageRoute() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, theme_preference, ui_size')
    .eq('id', user.id)
    .single()

  return (
    <SettingsPage
      username={profile?.username ?? ''}
      themePreference={profile?.theme_preference ?? 'system'}
      uiSizePreference={profile?.ui_size ?? 'regular'}
    />
  )
}
