import type { Board } from './board.type'
import type { WorkspaceRole } from './workspace.type'

export type Team = {
  id: string
  name: string
  memberCount: number
}

export type TeamsResponse = {
  teams: Team[]
}

export type TeamMember = {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  role: WorkspaceRole
}

export type TeamDetail = {
  id: string
  name: string
  slug: string
  memberCount: number
  boards: Board[]
  members: TeamMember[]
}
