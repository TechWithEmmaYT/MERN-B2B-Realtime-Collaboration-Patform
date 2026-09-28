import type { WorkspaceRole } from './workspace.type'

export type InvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired'

export type InvitePreview = {
  id: string
  email: string
  role: WorkspaceRole
  status: InvitationStatus
  expired: boolean
  workspaceName: string
  inviterName: string
  teamName: string | null
}

export type AcceptInviteResponse = {
  workspaceId: string
  teamId: string | null
}
