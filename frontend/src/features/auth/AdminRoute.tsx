import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from './auth-context'

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  return user?.role === 'ADMIN' ? children : <Navigate to="/" replace />
}
