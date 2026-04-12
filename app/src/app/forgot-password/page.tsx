import ForgotPasswordForm from './forgot-password-form'

export default function ForgotPasswordPage() {
  return (
    <main>
      <h1>Reset password</h1>
      <p>Enter your email and we&apos;ll send you a reset link.</p>
      <ForgotPasswordForm />
      <p>
        <a href="/login">Back to login</a>
      </p>
    </main>
  )
}
