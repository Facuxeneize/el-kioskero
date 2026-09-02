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
    <main className="auth-page">
      <section className="auth-shell">
        <aside className="auth-art" aria-label="Navegación de acceso">
          <div className="auth-art-copy"><span>EL KIOSKERO</span><strong>Tu negocio,<br />más simple.</strong></div>
          <nav className="auth-tabs">
            <Link className="active" to="/login">Ingresar</Link>
            <Link to="/registro">Registrarse</Link>
          </nav>
        </aside>
        <div className="auth-panel">
          <form className="auth-form" onSubmit={handleSubmit(submit)}>
            <header className="auth-heading">
              <div className="auth-logo-wrap"><img src={kioskeroLogo} alt="El Kioskero" /></div>
              <p className="eyebrow">BIENVENIDO</p><h1>Iniciá sesión</h1><p>Ingresá tus datos para administrar tu kiosco.</p>
            </header>
            <div className="auth-control auth-control-with-icon">
              <span className="auth-control-icon" aria-hidden="true">@</span><label htmlFor="identifier">Email o usuario</label>
              <input id="identifier" autoFocus autoComplete="username" type="text" {...register('identifier')} />
            </div>
            {formState.errors.identifier && <small className="field-error">{formState.errors.identifier.message}</small>}
            <div className="auth-control auth-control-with-icon auth-password-control">
              <span className="auth-control-icon" aria-hidden="true">●</span><label htmlFor="password">Contraseña</label>
              <input id="password" autoComplete="current-password" type={showPassword ? 'text' : 'password'} {...register('password')} />
              <button type="button" aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? 'Ocultar' : 'Ver'}</button>
            </div>
            {formState.errors.password && <small className="field-error">{formState.errors.password.message}</small>}
            {serverError && <div className="alert">{serverError}</div>}
            <button className="button primary auth-submit" disabled={formState.isSubmitting} type="submit">{formState.isSubmitting ? 'Ingresando…' : 'Ingresar'}</button>
            <p className="auth-switch">¿Todavía no tenés cuenta? <Link to="/registro">Registrate</Link></p>
          </form>
        </div>
      </section>
    </main>
  )
}
