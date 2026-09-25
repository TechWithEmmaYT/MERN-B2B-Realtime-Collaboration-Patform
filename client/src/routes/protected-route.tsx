import { Navigate, Outlet, useLocation } from 'react-router'

import { FullPageSpinner } from '@/components/full-page-spinner'
import { useAuth } from '@/context/auth-context'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <FullPageSpinner />
  if (!isAuthenticated) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />
  }

  return <Outlet />
}
