import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
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
}).refine((input) => input.password === input.confirmPassword, {
  message: 'Las contraseñas no coinciden.', path: ['confirmPassword'],
})

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
    try {
      await registerUser(input)
      navigate('/', { replace: true })
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'No se pudo crear la cuenta.')
    }
  }

  return (
    <main className="login-page register-page">
      <section className="login-brand">
        <img className="login-logo" src={kioskeroLogo} alt="El Kioskero" />
        <p className="eyebrow">CREÁ TU CUENTA</p>
        <h1>Tu kiosco,<br />listo para crecer.</h1>
        <p>Registrate y empezá a organizar productos, stock y ventas.</p>
      </section>
      <section className="login-panel">
        <form className="login-card register-card" onSubmit={handleSubmit(submit)}>
          <img className="login-card-logo" src={kioskeroLogo} alt="El Kioskero" />
          <div><p className="eyebrow">NUEVA CUENTA</p><h2>Registrate</h2><p className="muted">Todos los campos son necesarios.</p></div>
          <div className="auth-field-grid">
            <label>Nombre completo<input autoFocus autoComplete="name" {...register('name')} />{formState.errors.name && <small className="inline-error">{formState.errors.name.message}</small>}</label>
            <label>Nombre del kiosco<input autoComplete="organization" {...register('kioskName')} />{formState.errors.kioskName && <small className="inline-error">{formState.errors.kioskName.message}</small>}</label>
            <label>Nombre de usuario<input autoComplete="username" {...register('username')} />{formState.errors.username && <small className="inline-error">{formState.errors.username.message}</small>}</label>
            <label>Email<input autoComplete="email" type="email" {...register('email')} />{formState.errors.email && <small className="inline-error">{formState.errors.email.message}</small>}</label>
          </div>
          <label>Contraseña<div className="password-field"><input autoComplete="new-password" type={showPassword ? 'text' : 'password'} {...register('password')} /><button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? 'Ocultar' : 'Ver'}</button></div></label>
          {formState.errors.password && <small className="field-error">{formState.errors.password.message}</small>}
          <label>Repetir contraseña<input autoComplete="new-password" type={showPassword ? 'text' : 'password'} {...register('confirmPassword')} /></label>
          {formState.errors.confirmPassword && <small className="field-error">{formState.errors.confirmPassword.message}</small>}
          {serverError && <div className="alert">{serverError}</div>}
          <button className="button primary" disabled={formState.isSubmitting} type="submit">{formState.isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}</button>
          <p className="auth-switch">¿Ya tenés una cuenta? <Link to="/login">Iniciá sesión</Link></p>
        </form>
      </section>
    </main>
  )
}
