import { createSupabaseServerClient } from '@/lib/supabase/server'
import { logoutAction } from '@/app/actions/auth'

export default async function Home() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user!.id)
    .single()

  return (
    <main>
      <header>
        <span>Welcome, {profile?.username ?? user!.email}</span>
        <form action={logoutAction}>
          <button type="submit">Log out</button>
        </form>
      </header>
    </main>
  )
}
