import heroIllustration from '@/assets/illustrations/home-illustration.png'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowUpRightIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LayoutDashboardIcon,
  LayoutGridIcon,
  ListIcon,
  MapIcon,
  MessageCircleMoreIcon,
  MoreVerticalIcon,
  PlusIcon,
  ShapesIcon,
  StarIcon,
  UsersIcon,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'

import {
  boardTemplates,
  type BoardTemplate,
  type BoardTemplateId,
} from '@/components/boards/board-templates'
import {
  CreateBoardDialog,
  type CreateBoardValues,
} from '@/components/boards/create-board-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Spinner } from '@/components/ui/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/context/auth-context'
import { useTeams } from '@/context/teams-context'
import { createBoardMutationFn, getBoardsQueryFn } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { Board as ApiBoard } from '@/types'

type Board = {
  id: string
  teamId: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  iconClass: string
  memberCount: number
  lastOpened: string
  owner: { name: string; initials: string; avatar?: string }
  starred?: boolean
}

const templateIcons: Record<BoardTemplateId, Pick<Board, 'icon' | 'iconClass'>> = {
  blank: { icon: LayoutDashboardIcon, iconClass: 'bg-muted text-foreground' },
  brainstorm: {
    icon: MessageCircleMoreIcon,
    iconClass: 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400',
  },
  flowchart: {
    icon: ShapesIcon,
    iconClass: 'bg-amber-50 text-amber-500 dark:bg-amber-500/15',
  },
  roadmap: {
    icon: ArrowUpRightIcon,
    iconClass: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
  },
  journey: {
    icon: MapIcon,
    iconClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  },
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')

const mapBoard = (board: ApiBoard): Board => {
  const { icon, iconClass } =
    templateIcons[board.iconKey as BoardTemplateId] ?? templateIcons.blank
  return {
    id: board.id,
    teamId: board.teamId,
    name: board.title,
    description: board.description,
    icon,
    iconClass,
    memberCount: board.memberCount,
    lastOpened: board.lastOpenedAt ? 'Recently' : '—',
    owner: {
      name: board.owner.name,
      initials: initialsOf(board.owner.name),
      avatar: board.owner.avatarUrl ?? undefined,
    },
    starred: board.isStarred,
  }
}

export function DashboardHomePage() {
  const { workspaceId } = useParams()
  const { teams, selectedTeam, selectTeam } = useTeams()
  const queryClient = useQueryClient()
  const [view, setView] = useState<'grid' | 'list'>('list')
  const [createOpen, setCreateOpen] = useState(false)
  const [createTemplate, setCreateTemplate] = useState<BoardTemplateId>('blank')

  const boardsQuery = useQuery({
    queryKey: ['boards', workspaceId, selectedTeam?.id],
    queryFn: () => getBoardsQueryFn({ workspaceId: workspaceId!, teamId: selectedTeam!.id }),
    enabled: !!workspaceId && !!selectedTeam,
  })

  const createBoardMutation = useMutation({
    mutationFn: createBoardMutationFn,
  })

  const teamBoards = (boardsQuery.data?.boards ?? []).map(mapBoard)

  const openCreateBoard = (templateId: BoardTemplateId = 'blank') => {
    setCreateTemplate(templateId)
    setCreateOpen(true)
  }

  const handleCreateBoard = async (values: CreateBoardValues) => {
    const variables = {
      workspaceId: workspaceId!,
      teamId: values.teamId,
      title: values.title,
      description: values.description || undefined,
      templateKey: values.templateId,
    }
    await createBoardMutation.mutateAsync(variables)
    queryClient.invalidateQueries({ queryKey: ['boards', workspaceId] })
    if (variables.teamId !== selectedTeam?.id) selectTeam(variables.teamId)
    const team = teams.find((t) => t.id === variables.teamId)
    toast.success(`"${variables.title}" created in ${team?.name ?? 'your team'}`)
  }

  return (
    <div className="flex flex-1 flex-col gap-5">
      <Greeting />

      <section className="flex flex-col gap-3">
        <button
          type="button"
          className="flex w-fit items-center gap-1.5 text-base font-semibold tracking-tight"
        >
          Start from a template
          <ChevronRightIcon className="size-4 text-muted-foreground" />
        </button>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {boardTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={() => openCreateBoard(template.id)}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4 mt-3">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight">
            Boards in {selectedTeam?.name ?? 'this team'}
          </h2>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  All boards
                  <ChevronDownIcon data-icon="inline-end" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>All boards</DropdownMenuItem>
                <DropdownMenuItem>Owned by me</DropdownMenuItem>
                <DropdownMenuItem>Recently opened</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button onClick={() => openCreateBoard()}>
              <PlusIcon data-icon="inline-start" />
              Create new
            </Button>

            <div className="flex items-center overflow-hidden rounded-lg border">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Grid view"
                className={cn('rounded-none', view === 'grid' && 'bg-muted')}
                onClick={() => setView('grid')}
              >
                <LayoutGridIcon />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="List view"
                className={cn('rounded-none border-l', view === 'list' && 'bg-muted')}
                onClick={() => setView('list')}
              >
                <ListIcon />
              </Button>
            </div>
          </div>
        </header>

        {boardsQuery.isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner className="size-6" />
          </div>
        ) : teamBoards.length > 0 ? (
          <BoardsTable boards={teamBoards} />
        ) : (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <LayoutDashboardIcon />
              </EmptyMedia>
              <EmptyTitle>No boards in {selectedTeam?.name ?? 'this team'} yet</EmptyTitle>
              <EmptyDescription>
                Create the first board for this team, or start from a template above.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => openCreateBoard()}>
                <PlusIcon data-icon="inline-start" />
                Create board
              </Button>
            </EmptyContent>
          </Empty>
        )}

        <footer className="flex items-center justify-between pt-2">
          <span className="text-sm text-muted-foreground">
            {teamBoards.length} {teamBoards.length === 1 ? 'board' : 'boards'}
          </span>
          <div className="flex items-center overflow-hidden rounded-lg border">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Previous page"
              className="rounded-none"
              disabled
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Next page"
              className="rounded-none border-l"
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </footer>
      </section>

      <CreateBoardDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultTemplateId={createTemplate}
        onCreate={handleCreateBoard}
      />
    </div>
  )
}

function Greeting() {
  const { user } = useAuth()
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'there'

  return (
    <div className="flex items-center justify-between gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Good morning, {firstName}
        </h1>
        <p className="text-base text-muted-foreground">
          Turn ideas into reality, together.
        </p>
      </div>
      <img
        src={heroIllustration}
        alt=""
        className="hidden h-24 w-auto shrink-0 object-contain md:block"
      />
    </div>
  )
}

function TemplateCard({
  template,
  onSelect,
}: {
  template: BoardTemplate
  onSelect: () => void
}) {
  const isBlank = template.id === 'blank'
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex flex-col items-start gap-2 text-left"
    >
      <div
        className={cn(
          'flex h-28 w-full items-center justify-center overflow-hidden rounded-lg border p-4 transition group-hover:-translate-y-0.5 group-hover:shadow-sm',
          isBlank ? 'bg-amber-50 dark:bg-primary/10' : 'bg-muted/40',
        )}
      >
        {template.illustration}
      </div>
      <span className="text-sm">{template.name}</span>
    </button>
  )
}

function BoardsTable({ boards }: { boards: Board[] }) {
  const navigate = useNavigate()

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-10">
            <Checkbox aria-label="Select all boards" />
          </TableHead>
          <TableHead className="font-normal text-muted-foreground">Name</TableHead>
          <TableHead className="font-normal text-muted-foreground">
            People
          </TableHead>
          <TableHead className="font-normal text-muted-foreground">Last opened</TableHead>
          <TableHead className="font-normal text-muted-foreground">Owner</TableHead>
          <TableHead className="w-10" />
          <TableHead className="w-10 text-right">
            <MoreVerticalIcon className="ml-auto size-4 text-muted-foreground" />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {boards.map((board) => (
          <TableRow
            key={board.id}
            className="h-14 cursor-pointer"
            onClick={() => navigate(`/boards/${board.id}`)}
          >
            <TableCell onClick={(e) => e.stopPropagation()}>
              <Checkbox aria-label={`Select ${board.name}`} />
            </TableCell>
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
                  {board.owner.avatar ? (
                    <AvatarImage src={board.owner.avatar} alt={board.owner.name} />
                  ) : null}
                  <AvatarFallback className="bg-muted text-xs font-semibold">
                    {board.owner.initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-muted-foreground">{board.owner.name}</span>
              </div>
            </TableCell>
            <TableCell onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Star ${board.name}`}
                className="text-muted-foreground"
              >
                <StarIcon className={cn(board.starred && 'fill-primary text-primary')} />
              </Button>
            </TableCell>
            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Actions for ${board.name}`}
                    className="text-muted-foreground"
                  >
                    <MoreVerticalIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Open</DropdownMenuItem>
                  <DropdownMenuItem>Rename</DropdownMenuItem>
                  <DropdownMenuItem>Duplicate</DropdownMenuItem>
                  <DropdownMenuItem>Move</DropdownMenuItem>
                  <DropdownMenuItem>Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
