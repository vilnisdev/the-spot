import RegisterForm from './register-form'
import AuthShell from '@/components/auth/AuthShell'
import formStyles from '@/components/auth/authForm.module.css'

interface Props {
  searchParams: Promise<{ token?: string }>
}

export default async function RegisterPage({ searchParams }: Props) {
  const { token } = await searchParams
  return (
    <AuthShell>
      <div className={formStyles.card}>
        <h1 className={formStyles.heading}>Create your account.</h1>
        <RegisterForm inviteToken={token} />
      </div>
      <p className={formStyles.altLink}>
        Already have an account? <a href="/login">Log in</a>
      </p>
    </AuthShell>
  )
}
