import LoginForm from './login-form'
import AuthShell from '@/components/auth/AuthShell'
import formStyles from '@/components/auth/authForm.module.css'

interface Props {
  searchParams: Promise<{ next?: string; error?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const { next, error } = await searchParams

  return (
    <AuthShell>
      <div className={formStyles.card}>
        <h1 className={formStyles.heading}>Welcome back.</h1>
        {error === 'invalid_link' && (
          <p className={formStyles.error} role="alert">Invalid or expired link. Please try again.</p>
        )}
        <LoginForm next={next} />
      </div>
      <p className={formStyles.altLink}>
        Don&apos;t have an account? <a href="/register">Register</a>
      </p>
    </AuthShell>
  )
}
