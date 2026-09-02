import { NavLink, Outlet, useLocation } from 'react-router-dom'

import kioskeroLogo from '../../assets/kioskero-logo.png'
import { useAuth } from '../../features/auth/auth-context'

const links = [
  { to: '/', label: 'Resumen', icon: '⌂', end: true },
  { to: '/productos', label: 'Productos', icon: '▦' },
  { to: '/stock', label: 'Stock', icon: '▤' },
  { to: '/ventas/nueva', label: 'Nueva venta', icon: '+' },
  { to: '/ventas', label: 'Historial', icon: '↺' },
]

export function AppLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <nav className={user?.role === 'ADMIN' ? 'admin-nav' : undefined}>
          {user?.role === 'USER' && links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => isActive && !(link.to === '/ventas' && location.pathname === '/ventas/nueva') ? 'active' : undefined}>
              <span aria-hidden="true">{link.icon}</span><b>{link.label}</b>
            </NavLink>
          ))}
          {user?.role === 'ADMIN' && <NavLink to="/usuarios" className={({ isActive }) => isActive ? 'active' : undefined}><span aria-hidden="true">♙</span><b>Usuarios</b></NavLink>}
        </nav>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="topbar-brand"><img src={kioskeroLogo} alt="Logo de El Kioskero" /><strong>El Kioskero</strong></div>
          <div className="topbar-user">
            <span className="avatar">{user?.name.slice(0, 1).toUpperCase()}</span>
            <div><strong>{user?.name}</strong><small>{user?.kioskName || 'El Kioskero'} · {user?.role === 'ADMIN' ? 'Administrador' : 'Usuario'}</small></div>
            <button title="Cerrar sesión" aria-label="Cerrar sesión" onClick={() => void logout()}>↪</button>
          </div>
        </header>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  )
}
