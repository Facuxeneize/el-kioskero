import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from './auth-context'

export function ProtectedRoute() {
  const { user, isLoading } = useAuth()
  const location = useLocation()
  if (isLoading) return <div className="splash">Preparando tu kiosco…</div>
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return <Outlet />
}
