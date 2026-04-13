import RegisterForm from './register-form'

interface Props {
  searchParams: Promise<{ token?: string }>
}

export default async function RegisterPage({ searchParams }: Props) {
  const { token } = await searchParams
  return (
    <main>
      <h1>Create account</h1>
      <RegisterForm inviteToken={token} />
      <p>
        Already have an account? <a href="/login">Log in</a>
      </p>
    </main>
  )
}
