import { API } from '@/lib/axios-client'
import type {
  ApiSuccessResponse,
  AuthResponse,
  Board,
  BoardDetail,
  BoardsResponse,
  CreateBoardPayload,
  CreateWorkspacePayload,
  CurrentUserResponse,
  LoginPayload,
  MyWorkspacesResponse,
  RegisterPayload,
  SendInvitesPayload,
  SendInvitesResponse,
  SlugAvailabilityResponse,
  Team,
  TeamsResponse,
  Workspace,
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

export const googleAuthUrl = () =>
  `${import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'}/auth/google`

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

/* ---------------------------------- teams ---------------------------------- */

export const getTeamsQueryFn = async (workspaceId: string) => {
  const { data } = await API.get<ApiSuccessResponse<TeamsResponse>>(
    `/workspaces/${workspaceId}/teams`,
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
