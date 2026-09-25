import { useQuery } from '@tanstack/react-query'
import { createContext, useContext, type ReactNode } from 'react'

import { getCurrentUserQueryFn } from '@/lib/api'
import type { User } from '@/types'

type AuthContextValue = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const CURRENT_USER_QUERY_KEY = ['current-user'] as const

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: getCurrentUserQueryFn,
    retry: false,
    staleTime: Infinity,
  })

  const user = data?.user ?? null

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
