import { Navigate, Outlet, useSearchParams } from 'react-router'

import { FullPageSpinner } from '@/components/full-page-spinner'
import { useAuth } from '@/context/auth-context'

export function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const [searchParams] = useSearchParams()

  if (isLoading) return <FullPageSpinner />
  if (isAuthenticated) {
    const redirect = searchParams.get('redirect')
    return <Navigate to={redirect?.startsWith('/') ? redirect : '/dashboard'} replace />
  }

  return <Outlet />
}