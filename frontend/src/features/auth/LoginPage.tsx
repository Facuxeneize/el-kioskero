import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { useAuth } from './auth-context'

const schema = z.object({
  email: z.email('Ingresá un email válido.'),
  password: z.string().min(1, 'Ingresá tu contraseña.'),
})
type LoginInput = z.infer<typeof schema>

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState('')
  const { register, handleSubmit, formState } = useForm<LoginInput>({ resolver: zodResolver(schema) })

  if (user) return <Navigate to="/" replace />

  async function submit(input: LoginInput) {
    setServerError('')
    try {
      await login(input.email, input.password)
      const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/'
      navigate(destination, { replace: true })
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'No se pudo iniciar sesión.')
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand">
        <div className="brand-mark">K</div><p className="eyebrow">SISTEMA KIOSKO</p>
        <h1>Todo el negocio,<br />en un solo lugar.</h1><p>Productos, stock y ventas rápidas. Sin vueltas.</p>
      </section>
      <section className="login-panel">
        <form className="login-card" onSubmit={handleSubmit(submit)}>
          <div><p className="eyebrow">BIENVENIDO</p><h2>Iniciá sesión</h2><p className="muted">Ingresá con tu cuenta de administrador.</p></div>
          <label>Email<input autoFocus autoComplete="email" type="email" {...register('email')} /></label>
          {formState.errors.email && <small className="field-error">{formState.errors.email.message}</small>}
          <label>Contraseña<input autoComplete="current-password" type="password" {...register('password')} /></label>
          {formState.errors.password && <small className="field-error">{formState.errors.password.message}</small>}
          {serverError && <div className="alert">{serverError}</div>}
          <button className="button primary" disabled={formState.isSubmitting} type="submit">{formState.isSubmitting ? 'Ingresando…' : 'Ingresar'}</button>
        </form>
      </section>
    </main>
  )
}
