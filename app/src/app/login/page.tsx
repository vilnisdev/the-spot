import LoginForm from './login-form'

interface Props {
  searchParams: Promise<{ next?: string; error?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const { next, error } = await searchParams

  return (
    <main>
      <h1>Log in</h1>
      {error === 'invalid_link' && (
        <p role="alert">Invalid or expired link. Please try again.</p>
      )}
      <LoginForm next={next} />
      <p>
        <a href="/forgot-password">Forgot password?</a>
      </p>
      <p>
        Don&apos;t have an account? <a href="/register">Register</a>
      </p>
    </main>
  )
}
