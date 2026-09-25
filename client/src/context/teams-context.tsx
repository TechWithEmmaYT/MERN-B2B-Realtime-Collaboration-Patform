import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router'

import {
  createTeamMutationFn,
  getMyWorkspacesQueryFn,
  getTeamsQueryFn,
} from '@/lib/api'
import type { Team } from '@/types'

type TeamsContextValue = {
  teams: Team[]
  selectedTeam: Team | undefined
  canManageTeams: boolean
  isCreatingTeam: boolean
  isLoadingTeams: boolean
  selectTeam: (teamId: string) => void
  createTeam: (name: string) => Promise<Team>
}

const TeamsContext = createContext<TeamsContextValue | null>(null)

export function TeamsProvider({
  workspaceId,
  children,
}: {
  workspaceId: string | undefined
  children: ReactNode
}) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()

  const { data: workspacesData } = useQuery({
    queryKey: ['my-workspaces'],
    queryFn: getMyWorkspacesQueryFn,
  })
  const role = workspacesData?.workspaces.find((w) => w.id === workspaceId)?.role
  const canManageTeams = role === 'owner' || role === 'admin'

  const { data: teamsData, isLoading: isLoadingTeams } = useQuery({
    queryKey: ['teams', workspaceId],
    queryFn: () => getTeamsQueryFn(workspaceId!),
    enabled: !!workspaceId,
  })
  const teams = teamsData?.teams ?? []

  const createTeamMutation = useMutation({
    mutationFn: (name: string) => createTeamMutationFn({ workspaceId: workspaceId!, name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams', workspaceId] }),
  })

  const teamParam = searchParams.get('team')
  const selectedTeam = teams.find((team) => team.id === teamParam) ?? teams[0]

  const selectTeam = useCallback(
    (teamId: string) => navigate(`/dashboard/org/${workspaceId}?team=${teamId}`),
    [navigate, workspaceId],
  )

  const createTeam = useCallback(
    async (name: string): Promise<Team> => {
      const { team } = await createTeamMutation.mutateAsync(name)
      return team
    },
    [createTeamMutation],
  )

  const value = useMemo(
    () => ({
      teams,
      selectedTeam,
      canManageTeams,
      isCreatingTeam: createTeamMutation.isPending,
      isLoadingTeams,
      selectTeam,
      createTeam,
    }),
    [
      teams,
      selectedTeam,
      canManageTeams,
      createTeamMutation.isPending,
      isLoadingTeams,
      selectTeam,
      createTeam,
    ],
  )

  return <TeamsContext.Provider value={value}>{children}</TeamsContext.Provider>
}

export function useTeams() {
  const context = useContext(TeamsContext)
  if (!context) throw new Error('useTeams must be used inside TeamsProvider')
  return context
}

export const teamInitials = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const initials =
    words.length > 1 ? `${words[0]![0]}${words[1]![0]}` : (words[0] ?? '').slice(0, 2)
  return initials.toUpperCase()
}
