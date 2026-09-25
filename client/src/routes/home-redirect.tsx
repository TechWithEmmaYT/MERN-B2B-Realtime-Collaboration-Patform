import { useQuery } from '@tanstack/react-query'
import { Navigate } from 'react-router'

import { FullPageSpinner } from '@/components/full-page-spinner'
import { getMyWorkspacesQueryFn } from '@/lib/api'

export function DashboardHomeRedirect() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-workspaces'],
    queryFn: getMyWorkspacesQueryFn,
    staleTime: 0,
  })

  if (isLoading) return <FullPageSpinner />

  const workspace = data?.workspaces[0]
  if (workspace) return <Navigate to={`/dashboard/org/${workspace.id}`} replace />

  return <Navigate to="/onboarding/workspace" replace />
}
