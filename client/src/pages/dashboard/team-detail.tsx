import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowUpRightIcon,
  LayoutDashboardIcon,
  MoreVerticalIcon,
  UserMinusIcon,
  UserPlusIcon,
  UsersIcon,
} from 'lucide-react'
import { useState, type ComponentType } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { toast } from 'sonner'

import {
  AddTeamMembersDialog,
  type TeamMemberOption,
} from '@/components/teams/add-team-members-dialog'
import { getBoardIcon } from '@/components/boards/board-icon'
import { BoardGrid, BoardViewToggle, type BoardView } from '@/components/boards/board-grid'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { teamInitials, useTeams } from '@/context/teams-context'
import {
  addTeamMembersMutationFn,
  getTeamQueryFn,
  getWorkspaceMembersQueryFn,
  removeTeamMemberMutationFn,
} from '@/lib/api'
import { cn } from '@/lib/utils'
import type { Board as ApiBoard, TeamMember } from '@/types'

type OrgRole = 'owner' | 'admin' | 'member'

const ROLE_LABELS: Record<OrgRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')

type Board = {
  id: string
  name: string
  description: string
  icon: ComponentType<{ className?: string }>
  iconClass: string
  memberCount: number
  lastOpened: string
  owner: { id: string; name: string; avatarUrl: string | null }
  starred: boolean
}

const mapBoard = (board: ApiBoard): Board => {
  const { icon, iconClass } = getBoardIcon(board.iconKey)
  return {
    id: board.id,
    name: board.title,
    description: board.description,
    icon,
    iconClass,
    memberCount: board.memberCount,
    lastOpened: board.lastOpenedAt ? 'Recently' : '—',
    owner: board.owner,
    starred: board.isStarred,
  }
}

const EMPTY_MEMBERS: TeamMember[] = []

export function TeamDetailPage() {
  const { workspaceId, teamId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  // The tab lives in the URL (?tab=members), so links like 'Manage members' switch it
  // even when this page is already open.
  const tab = searchParams.get('tab') === 'members' ? 'members' : 'boards'
  const setTab = (value: string) =>
    setSearchParams(
      (params) => {
        const next = new URLSearchParams(params)
        if (value === 'members') next.set('tab', 'members')
        else next.delete('tab')
        return next
      },
      { replace: true },
    )

  const { canManageTeams } = useTeams()
  const queryClient = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [boardView, setBoardView] = useState<BoardView>('list')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['team', workspaceId, teamId],
    queryFn: () => getTeamQueryFn({ workspaceId: workspaceId!, teamId: teamId! }),
    enabled: !!workspaceId && !!teamId,
  })

  const team = data?.team
  const members = team?.members ?? EMPTY_MEMBERS
  const boards = (team?.boards ?? []).map(mapBoard)

  const workspaceMembersQuery = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => getWorkspaceMembersQueryFn(workspaceId!),
    enabled: !!workspaceId,
  })
  const workspaceMembers = workspaceMembersQuery.data?.members ?? []

  // Adding/removing team members changes member counts shown elsewhere too.
  const invalidateTeam = () => {
    queryClient.invalidateQueries({ queryKey: ['team', workspaceId, teamId] })
    queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] })
    // Sidebar team list + All teams page (memberCount).
    queryClient.invalidateQueries({ queryKey: ['teams', workspaceId] })
    // Home board list ("People" = team size).
    queryClient.invalidateQueries({ queryKey: ['boards', workspaceId] })
  }

  const addMembers = useMutation({
    mutationFn: addTeamMembersMutationFn,
    onSuccess: invalidateTeam,
  })

  const removeMember = useMutation({
    mutationFn: removeTeamMemberMutationFn,
    onSuccess: () => {
      invalidateTeam()
      toast.success('Member removed from team')
    },
    onError: (error: { message: string }) => toast.error(error.message),
  })

  const teamName = team?.name ?? 'Team'
  // Everyone in the workspace is always in General, so nobody can be removed from it.
  const isGeneral = team?.slug === 'general'

  if (isLoading) return <TeamDetailSkeleton />
  if (isError || !team) return <TeamDetailError />

  const teamMemberIds = new Set(members.map((member) => member.id))
  const available: TeamMemberOption[] = workspaceMembers
    .filter((member) => !teamMemberIds.has(member.id))
    .map((member) => ({ id: member.id, name: member.name, email: member.email }))

  const handleAdd = (ids: string[]) =>
    addMembers.mutateAsync({ workspaceId: workspaceId!, teamId: teamId!, userIds: ids })

  const handleRemove = (id: string) =>
    removeMember.mutate({ workspaceId: workspaceId!, teamId: teamId!, userId: id })

  return (
    <div className="flex flex-col gap-6 pt-2">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex size-12 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            {teamInitials(teamName)}
          </span>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">{teamName}</h1>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <UsersIcon className="size-4" />
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </p>
          </div>
        </div>

        {canManageTeams ? (
          <Button onClick={() => setAddOpen(true)} disabled={available.length === 0}>
            <UserPlusIcon data-icon="inline-start" />
            Add members
          </Button>
        ) : null}
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        {/* Tabs, view switch and content live in one card. */}
        <Card className="gap-0 py-0">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <TabsList>
              <TabsTrigger value="boards">Boards ({boards.length})</TabsTrigger>
              <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
            </TabsList>
            {tab === 'boards' && boards.length > 0 ? (
              <BoardViewToggle view={boardView} onChange={setBoardView} />
            ) : null}
          </div>

          <TabsContent
            value="boards"
            className={cn(boards.length === 0 || boardView === 'grid' ? 'p-4' : 'px-2 pb-2')}
          >
            {boards.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <LayoutDashboardIcon />
                  </EmptyMedia>
                  <EmptyTitle>No boards in this team yet</EmptyTitle>
                  <EmptyDescription>
                    Boards created in {teamName} will show up here.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : boardView === 'grid' ? (
              <BoardGrid
                boards={boards.map((board) => ({
                  ...board,
                  owner: {
                    name: board.owner.name,
                    initials: initialsOf(board.owner.name),
                    avatar: board.owner.avatarUrl ?? undefined,
                  },
                }))}
                onOpen={(id) => navigate(`/boards/${id}`)}
              />
            ) : (
              <BoardsTable boards={boards} onOpen={(id) => navigate(`/boards/${id}`)} />
            )}
          </TabsContent>

          <TabsContent value="members">
            {members.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <UsersIcon />
                  </EmptyMedia>
                  <EmptyTitle>No members in this team</EmptyTitle>
                  <EmptyDescription>Add workspace members to start collaborating.</EmptyDescription>
                </EmptyHeader>
                {canManageTeams ? (
                  <EmptyContent>
                    <Button onClick={() => setAddOpen(true)}>
                      <UserPlusIcon data-icon="inline-start" />
                      Add members
                    </Button>
                  </EmptyContent>
                ) : null}
              </Empty>
            ) : (
              <div className="flex flex-col divide-y">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 px-4 py-3">
                    <Avatar>
                      {member.avatarUrl ? (
                        <AvatarImage src={member.avatarUrl} alt={member.name} />
                      ) : null}
                      <AvatarFallback>{initialsOf(member.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm font-medium">
                        <span className="truncate">{member.name}</span>
                        {member.role === 'owner' ? <Badge variant="secondary">You</Badge> : null}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">{member.email}</p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="shrink-0 cursor-default text-xs text-muted-foreground">
                          {ROLE_LABELS[member.role as OrgRole]}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Workspace role</TooltipContent>
                    </Tooltip>
                    {isGeneral || !canManageTeams ? (
                      <span className="w-8" />
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Actions for ${member.name}`}
                            className="text-muted-foreground"
                          >
                            <MoreVerticalIcon />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            variant="destructive"
                            disabled={member.role === 'owner'}
                            onSelect={() => handleRemove(member.id)}
                          >
                            <UserMinusIcon />
                            Remove from team
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Card>
      </Tabs>

      <AddTeamMembersDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        available={available}
        onAdd={handleAdd}
      />
    </div>
  )
}

function BoardsTable({ boards, onOpen }: { boards: Board[]; onOpen: (id: string) => void }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="font-normal text-muted-foreground">Name</TableHead>
          <TableHead className="font-normal text-muted-foreground">People</TableHead>
          <TableHead className="font-normal text-muted-foreground">Last opened</TableHead>
          <TableHead className="font-normal text-muted-foreground">Owner</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {boards.map((board) => (
          <TableRow key={board.id} className="h-14 cursor-pointer" onClick={() => onOpen(board.id)}>
            <TableCell>
              <div className="flex items-center gap-4">
                <span
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-lg border',
                    board.iconClass,
                  )}
                >
                  <board.icon className="size-5" />
                </span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium">{board.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {board.description}
                  </span>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <UsersIcon className="size-4" />
                {board.memberCount} {board.memberCount === 1 ? 'person' : 'people'}
              </span>
            </TableCell>
            <TableCell className="text-muted-foreground">{board.lastOpened}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2.5">
                <Avatar className="size-8">
                  {board.owner.avatarUrl ? (
                    <AvatarImage src={board.owner.avatarUrl} alt={board.owner.name} />
                  ) : null}
                  <AvatarFallback className="text-xs">
                    {initialsOf(board.owner.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-muted-foreground">{board.owner.name}</span>
              </div>
            </TableCell>
            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Open ${board.name}`}
                className="text-muted-foreground"
              >
                <ArrowUpRightIcon />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function TeamDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 pt-2">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="size-12 rounded-lg" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <div className="flex flex-col divide-y rounded-lg border">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="size-10 rounded-lg" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TeamDetailError() {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <UsersIcon />
        </EmptyMedia>
        <EmptyTitle>Team not found</EmptyTitle>
        <EmptyDescription>
          This team doesn&apos;t exist or you don&apos;t have access.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
