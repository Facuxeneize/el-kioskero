import { createContext, useContext } from 'react'

export interface User {
  id: string
  name: string
  username: string
  email: string
  kioskName: string
  role: 'ADMIN' | 'USER'
  isActive: boolean
}

export interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (identifier: string, password: string) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => Promise<void>
}

export interface RegisterInput {
  name: string
  kioskName: string
  username: string
  email: string
  password: string
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe utilizarse dentro de AuthProvider.')
  return context
}
