import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { apiRequest, refreshAccessToken, setAccessToken } from '../../api/client'
import { AuthContext, type AuthContextValue, type User } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function restoreSession() {
      try {
        await refreshAccessToken()
        setUser(await apiRequest<User>('/auth/me'))
      } catch {
        setAccessToken(null)
      } finally {
        setIsLoading(false)
      }
    }
    void restoreSession()
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading,
    login: async (email, password) => {
      const data = await apiRequest<{ user: User; accessToken: string }>('/auth/login', {
        method: 'POST', body: JSON.stringify({ email, password }),
      }, false)
      setAccessToken(data.accessToken)
      setUser(data.user)
    },
    logout: async () => {
      try { await apiRequest('/auth/logout', { method: 'POST' }, false) }
      finally { setAccessToken(null); setUser(null) }
    },
  }), [isLoading, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
