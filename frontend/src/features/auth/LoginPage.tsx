import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import kioskeroLogo from '../../assets/kioskero-logo.png'
import { useAuth } from './auth-context'

const schema = z.object({
  identifier: z.string().trim().min(1, 'Ingresá tu email o usuario.'),
  password: z.string().min(1, 'Ingresá tu contraseña.'),
})
type LoginInput = z.infer<typeof schema>

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { register, handleSubmit, formState } = useForm<LoginInput>({ resolver: zodResolver(schema) })

  if (user) return <Navigate to="/" replace />

  async function submit(input: LoginInput) {
    setServerError('')
    try {
      await login(input.identifier, input.password)
      const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/'
      navigate(destination, { replace: true })
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'No se pudo iniciar sesión.')
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand">
        <img className="login-logo" src={kioskeroLogo} alt="El Kioskero" />
        <p className="eyebrow">EL KIOSKERO</p>
        <h1>Todo el negocio,<br />en un solo lugar.</h1><p>Productos, stock y ventas rápidas. Sin vueltas.</p>
      </section>
      <section className="login-panel">
        <form className="login-card" onSubmit={handleSubmit(submit)}>
          <img className="login-card-logo" src={kioskeroLogo} alt="El Kioskero" />
          <div><p className="eyebrow">BIENVENIDO</p><h2>Iniciá sesión</h2><p className="muted">Ingresá con tu email o nombre de usuario.</p></div>
          <label>Email o usuario<input autoFocus autoComplete="username" type="text" {...register('identifier')} /></label>
          {formState.errors.identifier && <small className="field-error">{formState.errors.identifier.message}</small>}
          <label>Contraseña<div className="password-field"><input autoComplete="current-password" type={showPassword ? 'text' : 'password'} {...register('password')} /><button type="button" aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? 'Ocultar' : 'Ver'}</button></div></label>
          {formState.errors.password && <small className="field-error">{formState.errors.password.message}</small>}
          {serverError && <div className="alert">{serverError}</div>}
          <button className="button primary" disabled={formState.isSubmitting} type="submit">{formState.isSubmitting ? 'Ingresando…' : 'Ingresar'}</button>
          <p className="auth-switch">¿Todavía no tenés cuenta? <Link to="/registro">Registrate</Link></p>
        </form>
      </section>
    </main>
  )
}
