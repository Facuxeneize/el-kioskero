import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from './auth-context'

export function UserRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  return user?.role === 'USER' ? children : <Navigate to="/usuarios" replace />
}
