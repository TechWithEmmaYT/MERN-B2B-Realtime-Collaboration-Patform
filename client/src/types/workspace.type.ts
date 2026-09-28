export type WorkspaceRole = 'owner' | 'admin' | 'member'

export type WorkspaceIconType = 'initials' | 'emoji' | 'image'

export type WorkspaceIconColor = 'yellow' | 'violet' | 'emerald' | 'pink' | 'sky'

export type Workspace = {
  id: string
  name: string
  slug: string
  iconType: WorkspaceIconType
  iconValue: string
  iconColor: WorkspaceIconColor
  ownerId: string
  createdAt: string
}

export type WorkspaceWithRole = Workspace & {
  role: WorkspaceRole
}

export type MyWorkspacesResponse = {
  workspaces: WorkspaceWithRole[]
}

export type CreateWorkspacePayload = {
  name: string
  slug?: string
  iconType?: WorkspaceIconType
  iconValue?: string
  iconColor?: WorkspaceIconColor
}

export type SlugAvailabilityResponse = {
  slug: string
  available: boolean
}

export type InviteMemberInput = {
  email: string
  role: WorkspaceRole
}

export type SendInvitesPayload = {
  workspaceId: string
  invites: InviteMemberInput[]
  defaultRole: WorkspaceRole
}

export type SendInvitesResponse = {
  invited: string[]
  skipped: string[]
}

export type WorkspaceMember = {
  id: string
  name: string
  email: string
  role: WorkspaceRole
  joinedAt: string
  teams: string[]
}

export type WorkspaceMembersResponse = {
  members: WorkspaceMember[]
}

export type PendingInvite = {
  id: string
  email: string
  role: WorkspaceRole
  invitedAt: string
}

export type PendingInvitesResponse = {
  invitations: PendingInvite[]
}

export type UpdateMemberRolePayload = {
  role: WorkspaceRole
}

export type WorkspaceSettings = Workspace & {
  role: WorkspaceRole | null
}

export type UpdateWorkspacePayload = {
  name?: string
  slug?: string
  iconType?: WorkspaceIconType
  iconValue?: string
  iconColor?: WorkspaceIconColor
}
