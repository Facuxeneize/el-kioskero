import { Navigate } from 'react-router-dom'

import { DashboardPage } from '../dashboard/DashboardPage'
import { useAuth } from './auth-context'

export function HomeRoute() {
  const { user } = useAuth()
  return user?.role === 'ADMIN' ? <Navigate to="/usuarios" replace /> : <DashboardPage />
}
