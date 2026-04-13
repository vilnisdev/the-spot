import { createClient, SupabaseClient } from '@supabase/supabase-js'

const URL = process.env.SUPABASE_TEST_URL!
const ANON_KEY = process.env.SUPABASE_TEST_ANON_KEY!
const SERVICE_ROLE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY!

export const admin = createClient(URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

export function anonClient(): SupabaseClient {
  return createClient(URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** Create an auth user + profile, return their credentials */
export async function createUser(emailPrefix: string) {
  const email = `${emailPrefix}-${Date.now()}@test.example`
  const password = 'Test1234!'
  const username = `${emailPrefix}${Date.now()}`

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username },
  })
  if (error) throw new Error(`createUser failed: ${error.message}`)

  return { id: data.user!.id, email, password, username }
}

/** Sign in as a user; return a client scoped to their session */
export async function signIn(email: string, password: string): Promise<SupabaseClient> {
  const base = anonClient()
  const { data, error } = await base.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`signIn failed: ${error.message}`)

  return createClient(URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${data.session!.access_token}` } },
  })
}

/** Hard-delete a list of auth users (cascades to profiles) */
export async function cleanupUsers(ids: string[]) {
  for (const id of ids) {
    await admin.auth.admin.deleteUser(id)
  }
}

/** Seed a network + owner membership via admin (bypasses RLS) */
export async function seedNetwork(ownerId: string, name = 'Test Network') {
  const { data, error } = await admin
    .from('networks')
    .insert({ name, owner_id: ownerId })
    .select('id')
    .single()
  if (error) throw new Error(`seedNetwork failed: ${error.message}`)

  await admin
    .from('memberships')
    .insert({ user_id: ownerId, network_id: data.id, role: 'owner' })

  return data.id as string
}

/** Add a user as a member to a network via admin */
export async function seedMembership(userId: string, networkId: string, role = 'member') {
  const { error } = await admin
    .from('memberships')
    .insert({ user_id: userId, network_id: networkId, role })
  if (error) throw new Error(`seedMembership failed: ${error.message}`)
}

/** Seed an invitation for a network via admin; returns { id, token } */
export async function seedInvitation(
  networkId: string,
  createdBy: string,
  overrides: Record<string, unknown> = {}
) {
  const { data, error } = await admin
    .from('invitations')
    .insert({ network_id: networkId, created_by: createdBy, ...overrides })
    .select('id, token')
    .single()
  if (error) throw new Error(`seedInvitation failed: ${error.message}`)
  return { id: data.id as string, token: data.token as string }
}

/** Seed a spot + spot_networks entry via admin */
export async function seedSpot(
  authorId: string,
  networkIds: string[],
  overrides: Record<string, unknown> = {}
) {
  const { data, error } = await admin
    .from('spots')
    .insert({
      author_id: authorId,
      title: 'Test Spot',
      lat: 45.0,
      lng: -93.0,
      date: '2026-01-01',
      ...overrides,
    })
    .select('id')
    .single()
  if (error) throw new Error(`seedSpot failed: ${error.message}`)

  for (const networkId of networkIds) {
    await admin.from('spot_networks').insert({ spot_id: data.id, network_id: networkId })
  }

  return data.id as string
}
