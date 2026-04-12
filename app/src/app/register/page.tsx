import RegisterForm from './register-form'

export default function RegisterPage() {
  return (
    <main>
      <h1>Create account</h1>
      <RegisterForm />
      <p>
        Already have an account? <a href="/login">Log in</a>
      </p>
    </main>
  )
}
