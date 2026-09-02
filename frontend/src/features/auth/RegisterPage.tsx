import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import kioskeroLogo from '../../assets/kioskero-logo.png'
import { useAuth } from './auth-context'

const schema = z.object({
  name: z.string().trim().min(2, 'Ingresá tu nombre.').max(120),
  kioskName: z.string().trim().min(2, 'Ingresá el nombre de tu kiosco.').max(160),
  username: z.string().trim().min(3, 'Usá al menos 3 caracteres.').max(60).regex(/^[a-zA-Z0-9._-]+$/, 'Usá letras, números, punto, guion o guion bajo.'),
  email: z.email('Ingresá un email válido.'),
  password: z.string().min(12, 'La contraseña debe tener al menos 12 caracteres.').max(128),
  confirmPassword: z.string(),
}).refine((input) => input.password === input.confirmPassword, { message: 'Las contraseñas no coinciden.', path: ['confirmPassword'] })
type RegisterForm = z.infer<typeof schema>

export function RegisterPage() {
  const { user, register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { register, handleSubmit, formState } = useForm<RegisterForm>({ resolver: zodResolver(schema) })

  if (user) return <Navigate to="/" replace />

  async function submit({ confirmPassword: _confirmPassword, ...input }: RegisterForm) {
    setServerError('')
    try { await registerUser(input); navigate('/', { replace: true }) }
    catch (error) { setServerError(error instanceof Error ? error.message : 'No se pudo crear la cuenta.') }
  }

  const field = (id: string, label: string, input: ReactNode, error?: string) => (
    <div className="auth-field-wrap"><div className="auth-control"><label htmlFor={id}>{label}</label>{input}</div>{error && <small className="field-error">{error}</small>}</div>
  )

  return (
    <main className="auth-page">
      <section className="auth-shell auth-shell-register">
        <aside className="auth-art" aria-label="Navegación de acceso">
          <div className="auth-art-copy"><span>EL KIOSKERO</span><strong>Empezá a ordenar<br />tu negocio.</strong></div>
          <nav className="auth-tabs"><Link to="/login">Ingresar</Link><Link className="active" to="/registro">Registrarse</Link></nav>
        </aside>
        <div className="auth-panel">
          <form className="auth-form auth-form-register" onSubmit={handleSubmit(submit)}>
            <header className="auth-heading">
              <div className="auth-logo-wrap"><img src={kioskeroLogo} alt="El Kioskero" /></div>
              <p className="eyebrow">NUEVA CUENTA</p><h1>Registrate</h1><p>Creá tu espacio para administrar el kiosco.</p>
            </header>
            <div className="auth-fields-grid">
              {field('name', 'Nombre completo', <input id="name" autoFocus autoComplete="name" {...register('name')} />, formState.errors.name?.message)}
              {field('kioskName', 'Nombre del kiosco', <input id="kioskName" autoComplete="organization" {...register('kioskName')} />, formState.errors.kioskName?.message)}
              {field('username', 'Nombre de usuario', <input id="username" autoComplete="username" {...register('username')} />, formState.errors.username?.message)}
              {field('email', 'Email', <input id="email" autoComplete="email" type="email" {...register('email')} />, formState.errors.email?.message)}
              <div className="auth-field-wrap">
                <div className="auth-control auth-password-control"><label htmlFor="new-password">Contraseña</label><input id="new-password" autoComplete="new-password" type={showPassword ? 'text' : 'password'} {...register('password')} /><button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? 'Ocultar' : 'Ver'}</button></div>
                {formState.errors.password && <small className="field-error">{formState.errors.password.message}</small>}
              </div>
              {field('confirm-password', 'Repetir contraseña', <input id="confirm-password" autoComplete="new-password" type={showPassword ? 'text' : 'password'} {...register('confirmPassword')} />, formState.errors.confirmPassword?.message)}
            </div>
            {serverError && <div className="alert">{serverError}</div>}
            <button className="button primary auth-submit" disabled={formState.isSubmitting} type="submit">{formState.isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}</button>
            <p className="auth-switch">¿Ya tenés una cuenta? <Link to="/login">Iniciá sesión</Link></p>
          </form>
        </div>
      </section>
    </main>
  )
}
