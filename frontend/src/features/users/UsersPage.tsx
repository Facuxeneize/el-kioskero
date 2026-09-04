import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'

import { apiRequest } from '../../api/client'
import { Modal } from '../../components/common/Modal'
import { useAuth } from '../auth/auth-context'

interface ManagedUser {
  id: string
  name: string
  kioskName: string
  username: string
  email: string
  role: 'ADMIN' | 'USER'
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

interface UserForm {
  name: string
  kioskName: string
  username: string
  email: string
  role: 'ADMIN' | 'USER'
  isActive: boolean
  password: string
  confirmPassword: string
}

export function UsersPage() {
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<ManagedUser | null>(null)
  const [form, setForm] = useState<UserForm | null>(null)
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const users = useQuery({
    queryKey: ['users', search],
    queryFn: () => apiRequest<ManagedUser[]>(`/users?search=${encodeURIComponent(search)}`),
  })

  const save = useMutation({
    mutationFn: () => {
      if (form!.password && form!.password !== form!.confirmPassword) {
        throw new Error('Las contraseÃ±as no coinciden.')
      }
      const { confirmPassword: _confirmPassword, ...input } = form!
      return apiRequest<ManagedUser>(`/users/${editing!.id}`, {
        method: 'PATCH', body: JSON.stringify(input.password ? input : { ...input, password: undefined }),
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      setEditing(null)
      setForm(null)
      setMessage('Usuario actualizado correctamente.')
    },
  })

  function openEdit(user: ManagedUser) {
    setEditing(user)
    setForm({ name: user.name, kioskName: user.kioskName, username: user.username, email: user.email, role: user.role, isActive: user.isActive, password: '', confirmPassword: '' })
    setShowPassword(false)
    setMessage('')
    save.reset()
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    save.mutate()
  }

  return (
    <section className="page">
      <header className="page-header">
        <div><p className="eyebrow">ADMINISTRACIÓN</p><h1>Usuarios</h1><p className="muted">Consultá cuentas, roles y estado de acceso.</p></div>
      </header>
      {message && <div className="notice success-notice">{message}</div>}
      <div className="panel">
        <div className="toolbar">
          <input aria-label="Buscar usuarios" placeholder="Buscar por nombre, kiosco, usuario o email…" value={search} onChange={(event) => setSearch(event.target.value)} />
          <span>{users.data?.length ?? 0} usuarios</span>
        </div>
        {users.isError && <div className="alert panel-alert">{users.error.message}</div>}
        {users.isLoading ? <div className="empty"><p>Cargando usuarios…</p></div> : users.data?.length ? (
          <div className="table-wrap">
            <table className="mobile-card-table users-table">
              <thead><tr><th>Usuario</th><th>Kiosco</th><th>Rol</th><th>Estado</th><th>Último acceso</th><th>Acciones</th></tr></thead>
              <tbody>{users.data.map((user) => (
                <tr key={user.id}>
                  <td data-label="Usuario"><strong>{user.name}</strong><small className="cell-note">@{user.username} · {user.email}</small></td>
                  <td data-label="Kiosco">{user.kioskName}</td>
                  <td data-label="Rol"><span className={`pill ${user.role === 'ADMIN' ? 'warning' : 'neutral'}`}>{user.role === 'ADMIN' ? 'Administrador' : 'Usuario'}</span></td>
                  <td data-label="Estado"><span className={`pill ${user.isActive ? 'success' : 'danger'}`}>{user.isActive ? 'Activo' : 'Inactivo'}</span></td>
                  <td data-label="Último acceso">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('es-AR') : 'Nunca'}</td>
                  <td data-label="Acciones" className="row-actions"><button onClick={() => openEdit(user)}>Gestionar</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <div className="empty"><strong>No hay usuarios</strong><p>No encontramos cuentas con ese criterio.</p></div>}
      </div>

      {editing && form && <Modal title={`Gestionar a ${editing.name}`} onClose={() => { setEditing(null); setForm(null) }}>
        <form className="form-grid" onSubmit={submit}>
          <label>Nombre<input required minLength={2} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label>Nombre del kiosco<input required minLength={2} value={form.kioskName} onChange={(event) => setForm({ ...form, kioskName: event.target.value })} /></label>
          <label>Usuario<input required minLength={3} value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} /></label>
          <label>Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label>Rol<select value={form.role} disabled={editing.id === currentUser?.id} onChange={(event) => setForm({ ...form, role: event.target.value as UserForm['role'] })}><option value="USER">Usuario</option><option value="ADMIN">Administrador</option></select></label>
          <label>Estado<select value={String(form.isActive)} disabled={editing.id === currentUser?.id} onChange={(event) => setForm({ ...form, isActive: event.target.value === 'true' })}><option value="true">Activo</option><option value="false">Inactivo</option></select></label>
          <label>Nueva contraseÃ±a<span className="password-field"><input minLength={12} maxLength={128} autoComplete="new-password" placeholder="Dejar en blanco para conservarla" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /><button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? 'Ocultar' : 'Ver'}</button></span></label>
          <label>Repetir contraseÃ±a<input minLength={12} maxLength={128} autoComplete="new-password" type={showPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} /></label>
          {save.isError && <div className="alert full">{save.error.message}</div>}
          <div className="form-actions full"><button className="button secondary" type="button" onClick={() => { setEditing(null); setForm(null) }}>Cancelar</button><button className="button primary" disabled={save.isPending} type="submit">{save.isPending ? 'Guardando…' : 'Guardar cambios'}</button></div>
        </form>
      </Modal>}
    </section>
  )
}
