import { API, API_BASE_URL } from '@/lib/axios-client'
import type {
  AcceptInviteResponse,
  ApiSuccessResponse,
  AuthResponse,
  Board,
  BoardDetail,
  BoardTemplateContent,
  BoardsResponse,
  CreateBoardPayload,
  CreateWorkspacePayload,
  CurrentUserResponse,
  InvitePreview,
  LoginPayload,
  MyWorkspacesResponse,
  PendingInvitesResponse,
  RegisterPayload,
  SendInvitesPayload,
  SendInvitesResponse,
  SlugAvailabilityResponse,
  Team,
  TeamDetail,
  TeamsResponse,
  UpdateMemberRolePayload,
  UpdateWorkspacePayload,
  Workspace,
  WorkspaceMembersResponse,
  WorkspaceSettings,
} from '@/types'

/* ---------------------------------- auth ---------------------------------- */

export const registerMutationFn = async (payload: RegisterPayload) => {
  const { data } = await API.post<ApiSuccessResponse<AuthResponse>>(
    '/auth/register',
    payload,
  )
  return data.data
}

export const loginMutationFn = async (payload: LoginPayload) => {
  const { data } = await API.post<ApiSuccessResponse<AuthResponse>>(
    '/auth/login',
    payload,
  )
  return data.data
}

export const logoutMutationFn = async () => {
  const { data } = await API.post<ApiSuccessResponse<null>>('/auth/logout')
  return data.data
}

export const getCurrentUserQueryFn = async () => {
  const { data } = await API.get<ApiSuccessResponse<CurrentUserResponse>>(
    '/auth/status',
  )
  return data.data
}

export const googleAuthUrl = () => `${API_BASE_URL}/auth/google`

/* ------------------------------ invitations ------------------------------- */

export const previewInviteQueryFn = async (token: string) => {
  const { data } = await API.get<ApiSuccessResponse<{ invitation: InvitePreview }>>(
    `/invitations/${token}`,
  )
  return data.data
}

export const acceptInviteMutationFn = async (token: string) => {
  const { data } = await API.post<ApiSuccessResponse<AcceptInviteResponse>>(
    `/invitations/${token}/accept`,
  )
  return data.data
}

/* -------------------------------- workspace ------------------------------- */

export const createWorkspaceMutationFn = async (
  payload: CreateWorkspacePayload,
) => {
  const { data } = await API.post<ApiSuccessResponse<{ workspace: Workspace }>>(
    '/workspaces',
    payload,
  )
  return data.data
}

export const checkSlugQueryFn = async (slug: string) => {
  const { data } = await API.get<ApiSuccessResponse<SlugAvailabilityResponse>>(
    `/workspaces/slug-available`,
    { params: { slug } },
  )
  return data.data
}

export const getMyWorkspacesQueryFn = async () => {
  const { data } = await API.get<ApiSuccessResponse<MyWorkspacesResponse>>(
    '/workspaces',
  )
  return data.data
}

export const sendInvitesMutationFn = async ({
  workspaceId,
  ...payload
}: SendInvitesPayload) => {
  const { data } = await API.post<ApiSuccessResponse<SendInvitesResponse>>(
    `/workspaces/${workspaceId}/invitations`,
    payload,
  )
  return data.data
}

export const getPendingInvitesQueryFn = async (workspaceId: string) => {
  const { data } = await API.get<ApiSuccessResponse<PendingInvitesResponse>>(
    `/workspaces/${workspaceId}/invitations`,
  )
  return data.data
}

export const revokeInvitationMutationFn = async ({
  workspaceId,
  invitationId,
}: {
  workspaceId: string
  invitationId: string
}) => {
  const { data } = await API.delete<ApiSuccessResponse<{ invitation: { id: string; status: string } }>>(
    `/workspaces/${workspaceId}/invitations/${invitationId}`,
  )
  return data.data
}

export const getWorkspaceQueryFn = async (workspaceId: string) => {
  const { data } = await API.get<ApiSuccessResponse<{ workspace: WorkspaceSettings }>>(
    `/workspaces/${workspaceId}`,
  )
  return data.data
}

export const updateWorkspaceMutationFn = async ({
  workspaceId,
  ...payload
}: { workspaceId: string } & UpdateWorkspacePayload) => {
  const { data } = await API.patch<ApiSuccessResponse<{ workspace: Workspace }>>(
    `/workspaces/${workspaceId}`,
    payload,
  )
  return data.data
}

/* ---------------------------------- teams ---------------------------------- */

export const getTeamsQueryFn = async (workspaceId: string) => {
  const { data } = await API.get<ApiSuccessResponse<TeamsResponse>>(
    `/workspaces/${workspaceId}/teams`,
  )
  return data.data
}

export const getTeamQueryFn = async ({
  workspaceId,
  teamId,
}: {
  workspaceId: string
  teamId: string
}) => {
  const { data } = await API.get<ApiSuccessResponse<{ team: TeamDetail }>>(
    `/workspaces/${workspaceId}/teams/${teamId}`,
  )
  return data.data
}

export const createTeamMutationFn = async ({
  workspaceId,
  name,
}: {
  workspaceId: string
  name: string
}) => {
  const { data } = await API.post<ApiSuccessResponse<{ team: Team }>>(
    `/workspaces/${workspaceId}/teams`,
    { name },
  )
  return data.data
}

export const addTeamMembersMutationFn = async ({
  workspaceId,
  teamId,
  userIds,
}: {
  workspaceId: string
  teamId: string
  userIds: string[]
}) => {
  const { data } = await API.post<ApiSuccessResponse<{ added: string[]; skipped: string[] }>>(
    `/workspaces/${workspaceId}/teams/${teamId}/members`,
    { userIds },
  )
  return data.data
}

export const removeTeamMemberMutationFn = async ({
  workspaceId,
  teamId,
  userId,
}: {
  workspaceId: string
  teamId: string
  userId: string
}) => {
  const { data } = await API.delete<ApiSuccessResponse<null>>(
    `/workspaces/${workspaceId}/teams/${teamId}/members/${userId}`,
  )
  return data.data
}

/* ---------------------------------- boards --------------------------------- */

export const getBoardsQueryFn = async ({
  workspaceId,
  teamId,
}: {
  workspaceId: string
  teamId: string
}) => {
  const { data } = await API.get<ApiSuccessResponse<BoardsResponse>>(
    `/workspaces/${workspaceId}/boards`,
    { params: { teamId } },
  )
  return data.data
}

export const createBoardMutationFn = async ({
  workspaceId,
  ...payload
}: { workspaceId: string } & CreateBoardPayload) => {
  const { data } = await API.post<ApiSuccessResponse<{ board: Board }>>(
    `/workspaces/${workspaceId}/boards`,
    payload,
  )
  return data.data
}

export const getBoardQueryFn = async (boardId: string) => {
  const { data } = await API.get<ApiSuccessResponse<{ board: BoardDetail }>>(
    `/boards/${boardId}`,
  )
  return data.data
}

export const getBoardTemplateQueryFn = async (key: string) => {
  const { data } = await API.get<ApiSuccessResponse<{ template: BoardTemplateContent }>>(
    `/boards/templates/${key}`,
  )
  return data.data
}

export const aiChatMutationFn = async ({
  boardId,
  feedId,
  messages,
  context,
}: {
  boardId: string
  feedId: string
  messages: { role: 'user' | 'assistant'; content: string }[]
  context?: string
}) => {
  const { data } = await API.post<ApiSuccessResponse<{ accepted: boolean }>>(
    `/ai/boards/${boardId}/chat`,
    { feedId, messages, context },
  )
  return data.data
}

export const stopAiChatMutationFn = async ({
  boardId,
  feedId,
}: {
  boardId: string
  feedId: string
}) => {
  const { data } = await API.post<ApiSuccessResponse<{ ok: boolean }>>(
    `/ai/boards/${boardId}/chat/stop`,
    { feedId },
  )
  return data.data
}

/* ------------------------------- liveblocks -------------------------------- */

export const liveblocksAuthEndpoint = async (room?: string) => {
  const response = await fetch(`${API_BASE_URL}/liveblocks-auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ room }),
  })
  return response.json()
}

/* --------------------------------- members --------------------------------- */

export type ResolvedUser = { id: string; name: string; avatar: string; color: string }

// Name, avatar and colour for workspace members (Liveblocks `resolveUsers`).
export const getWorkspaceMembersQueryFn = async (workspaceId: string) => {
  const { data } = await API.get<ApiSuccessResponse<WorkspaceMembersResponse>>(
    `/workspaces/${workspaceId}/members`,
  )
  return data.data
}

export const updateMemberRoleMutationFn = async ({
  workspaceId,
  userId,
  role,
}: { workspaceId: string; userId: string } & UpdateMemberRolePayload) => {
  const { data } = await API.patch<ApiSuccessResponse<{ member: { id: string; role: string } }>>(
    `/workspaces/${workspaceId}/members/${userId}/role`,
    { role },
  )
  return data.data
}

export const removeMemberMutationFn = async ({
  workspaceId,
  userId,
}: {
  workspaceId: string
  userId: string
}) => {
  const { data } = await API.delete<ApiSuccessResponse<null>>(
    `/workspaces/${workspaceId}/members/${userId}`,
  )
  return data.data
}

export const resolveWorkspaceUsersFn = async (workspaceId: string, userIds: string[]) => {
  const { data } = await API.get<ApiSuccessResponse<{ users: ResolvedUser[] }>>(
    `/workspaces/${workspaceId}/members/resolve`,
    { params: { ids: userIds.join(',') } },
  )
  return data.data.users
}

// Member ids matching `q` (Liveblocks `resolveMentionSuggestions`).
export const searchWorkspaceMembersFn = async (workspaceId: string, q: string) => {
  const { data } = await API.get<ApiSuccessResponse<{ userIds: string[] }>>(
    `/workspaces/${workspaceId}/members/search`,
    { params: { q } },
  )
  return data.data.userIds
}
