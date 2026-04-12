import { describe, it, expect, afterEach } from 'vitest'
import { admin, anonClient, createUser, cleanupUsers, signIn } from '../helpers/seed'

const createdUserIds: string[] = []

afterEach(async () => {
  if (createdUserIds.length) {
    await cleanupUsers([...createdUserIds])
    createdUserIds.length = 0
  }
})

// Cycle 1 & 2: Register
describe('Auth: Register', () => {
  it('profile trigger creates profile with username from user metadata', async () => {
    // Anon signUp sends confirmation emails (hitting rate limits in test env).
    // Test the trigger directly via admin API (email_confirm:true bypasses email sending).
    const { id, username } = await createUser('regtest')
    createdUserIds.push(id)

    // Profile auto-created via handle_new_user trigger
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('username')
      .eq('id', id)
      .single()

    expect(profileError).toBeNull()
    expect(profile?.username).toBe(username)
  })

  it('duplicate signUp does not create a second auth user in the database', async () => {
    const { id, email, password } = await createUser('duptest')
    createdUserIds.push(id)

    // Supabase returns a fake/obfuscated user on duplicate signUp (anti-enumeration).
    // Verify: only ONE user with this email exists in auth.users.
    const client = anonClient()
    await client.auth.signUp({ email, password }) // may return fake user — that is expected

    const { data: users } = await admin.auth.admin.listUsers()
    const matching = users.users.filter((u) => u.email === email)
    expect(matching).toHaveLength(1)
    expect(matching[0].id).toBe(id)
  })
})

// Cycle 3 & 4: Login
describe('Auth: Login', () => {
  it('signInWithPassword returns valid session', async () => {
    const { id, email, password } = await createUser('logintest')
    createdUserIds.push(id)

    const client = anonClient()
    const { data, error } = await client.auth.signInWithPassword({ email, password })

    expect(error).toBeNull()
    expect(data.session).not.toBeNull()
    expect(data.session!.access_token).toBeTruthy()
    expect(data.user!.email).toBe(email)
  })

  it('wrong password returns auth error', async () => {
    const { id, email } = await createUser('badpasstest')
    createdUserIds.push(id)

    const client = anonClient()
    const { error } = await client.auth.signInWithPassword({
      email,
      password: 'WrongPassword999!',
    })

    expect(error).not.toBeNull()
  })
})

// Cycle 5 & 6: Change password
describe('Auth: Change Password', () => {
  it('authenticated user can update password and new password works', async () => {
    const { id, email, password } = await createUser('changepwtest')
    createdUserIds.push(id)

    // Sign in on the SAME client so the session lives in client memory
    // (signIn helper uses Bearer header which works for DB but not auth.updateUser)
    const client = anonClient()
    const { error: signInError } = await client.auth.signInWithPassword({ email, password })
    expect(signInError).toBeNull()

    const newPassword = 'NewPass5678!'
    const { error } = await client.auth.updateUser({ password: newPassword })
    expect(error).toBeNull()

    // Verify new password works
    const verifyClient = anonClient()
    const { data, error: loginError } = await verifyClient.auth.signInWithPassword({
      email,
      password: newPassword,
    })
    expect(loginError).toBeNull()
    expect(data.session).not.toBeNull()
  })

  it('unauthenticated client cannot update password', async () => {
    const client = anonClient()
    const { error } = await client.auth.updateUser({ password: 'Hacked1234!' })

    expect(error).not.toBeNull()
  })
})

// Cycle 7: Password reset API
describe('Auth: Password Reset', () => {
  it('resetPasswordForEmail reaches the Supabase Auth API without unexpected errors', async () => {
    const { id, email } = await createUser('resettest')
    createdUserIds.push(id)

    const client = anonClient()
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:3000/auth/confirm?next=/reset-password',
    })

    // The anon client validates emails — test domains may be blocked.
    // Accept success or email validation rejection; any other error is unexpected.
    if (error) {
      expect(error.message).toMatch(/invalid|not allowed|email/i)
    } else {
      expect(error).toBeNull()
    }
  })
})
