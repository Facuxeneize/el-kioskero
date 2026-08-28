import { NavLink, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '../../features/auth/auth-context'
import kioskeroLogo from '../../assets/kioskero-logo.png'

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
        <div className="logo"><img src={kioskeroLogo} alt="Logo de El Kioskero" /><strong>El Kioskero</strong></div>
        <nav className={user?.role === 'ADMIN' ? 'admin-nav' : undefined}>
          {user?.role === 'USER' && links.map((link) => <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => isActive && !(link.to === '/ventas' && location.pathname === '/ventas/nueva') ? 'active' : undefined}><span aria-hidden="true">{link.icon}</span>{link.label}</NavLink>)}
          {user?.role === 'ADMIN' && <NavLink to="/usuarios" className={({ isActive }) => isActive ? 'active' : undefined}><span aria-hidden="true">♙</span>Usuarios</NavLink>}
        </nav>
        <div className="profile">
          <span className="avatar">{user?.name.slice(0, 1).toUpperCase()}</span>
          <div><strong>{user?.name}</strong><small>{user?.kioskName} · {user?.role === 'ADMIN' ? 'Administrador' : 'Usuario'}</small></div>
          <button title="Cerrar sesión" onClick={() => void logout()}>↪</button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
