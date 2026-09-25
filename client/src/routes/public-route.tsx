import { Navigate, Outlet } from 'react-router'

import { FullPageSpinner } from '@/components/full-page-spinner'
import { useAuth } from '@/context/auth-context'

export function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <FullPageSpinner />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  return <Outlet />
}
