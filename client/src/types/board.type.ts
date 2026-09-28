import type { FlowEdge, FlowNode } from './flow'

export type BoardOwner = {
  id: string
  name: string
  avatarUrl: string | null
}

export type Board = {
  id: string
  title: string
  description: string
  iconKey: string
  templateKey: string | null
  teamId: string
  owner: BoardOwner
  memberCount: number
  isStarred: boolean
  lastOpenedAt: string | null
  updatedAt: string
  createdAt: string
}

export type BoardsResponse = {
  boards: Board[]
}

export type BoardDetail = Board & {
  workspaceId: string
  roomId: string
}

export type CreateBoardPayload = {
  teamId: string
  title: string
  description?: string
  templateKey?: string
}

export type BoardTemplateContent = {
  key: string
  nodes: FlowNode[]
  edges: FlowEdge[]
}
