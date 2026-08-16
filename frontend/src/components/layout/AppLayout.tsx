import { NavLink, Outlet } from 'react-router-dom'

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
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo"><span>K</span><strong>Kiosko</strong></div>
        <nav>
          {links.map((link) => <NavLink key={link.to} to={link.to} end={link.end}><span aria-hidden="true">{link.icon}</span>{link.label}</NavLink>)}
        </nav>
        <div className="profile">
          <span className="avatar">{user?.name.slice(0, 1).toUpperCase()}</span>
          <div><strong>{user?.name}</strong><small>Administrador</small></div>
          <button title="Cerrar sesión" onClick={() => void logout()}>↪</button>
        </div>
      </aside>
      <main className="content"><Outlet /></main>
    </div>
  )
}
