import {
  ChevronRightIcon,
  LayoutGridIcon,
  ListIcon,
  PlusIcon,
  SearchIcon,
  UsersIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'

import { CreateTeamDialog } from '@/components/teams/create-team-dialog'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Skeleton } from '@/components/ui/skeleton'
import { teamInitials, useTeams } from '@/context/teams-context'
import { cn } from '@/lib/utils'

// "All teams": every team you can see in this workspace, with shortcuts to its
// boards (Home filtered by team) and its members page.
export function TeamPage() {
  const { workspaceId } = useParams()
  const base = `/dashboard/org/${workspaceId}`
  const { teams, isLoadingTeams, canManageTeams } = useTeams()
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [view, setView] = useState<'list' | 'grid'>('list')

  const query = search.trim().toLowerCase()
  const visibleTeams = query
    ? teams.filter((team) => team.name.toLowerCase().includes(query))
    : teams

  return (
    <div className="flex flex-col gap-6 pt-2">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">All teams</h1>
          <p className="text-muted-foreground">
            {teams.length} {teams.length === 1 ? 'team' : 'teams'} in this workspace.
          </p>
        </div>

        {canManageTeams ? (
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon data-icon="inline-start" />
            Create team
          </Button>
        ) : null}
      </header>

      <div className="flex items-center justify-between gap-3">
        <InputGroup className="w-full max-w-xs">
          <InputGroupAddon align="inline-start">
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search teams…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </InputGroup>

        <div className="flex items-center overflow-hidden rounded-lg border">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Grid view"
            aria-pressed={view === 'grid'}
            className={cn('rounded-none', view === 'grid' && 'bg-muted')}
            onClick={() => setView('grid')}
          >
            <LayoutGridIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="List view"
            aria-pressed={view === 'list'}
            className={cn('rounded-none border-l', view === 'list' && 'bg-muted')}
            onClick={() => setView('list')}
          >
            <ListIcon />
          </Button>
        </div>
      </div>

      {isLoadingTeams ? (
        <div className="flex flex-col gap-1">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5">
              <Skeleton className="size-9 rounded-md" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))}
        </div>
      ) : teams.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UsersIcon />
            </EmptyMedia>
            <EmptyTitle>No teams yet</EmptyTitle>
            <EmptyDescription>
              Teams group people and their boards. Create one to get started.
            </EmptyDescription>
          </EmptyHeader>
          {canManageTeams ? (
            <EmptyContent>
              <Button onClick={() => setCreateOpen(true)}>
                <PlusIcon data-icon="inline-start" />
                Create team
              </Button>
            </EmptyContent>
          ) : null}
        </Empty>
      ) : (
        visibleTeams.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No teams match “{search}”.
          </p>
        ) : view === 'list' ? (
          // Plain list: no box, just rows that highlight on hover.
          <div className="flex flex-col gap-1">
            {visibleTeams.map((team) => (
              <Link
                key={team.id}
                to={`${base}/teams/${team.id}`}
                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-muted"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                  {teamInitials(team.name)}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{team.name}</span>
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <UsersIcon className="size-4" />
                  {team.memberCount} {team.memberCount === 1 ? 'member' : 'members'}
                </span>
                <ChevronRightIcon className="size-4 text-muted-foreground transition group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {visibleTeams.map((team) => (
              <Link
                key={team.id}
                to={`${base}/teams/${team.id}`}
                className="group flex flex-col gap-3 rounded-xl bg-muted/50 p-4 transition hover:bg-muted"
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                  {teamInitials(team.name)}
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="truncate text-sm font-medium">{team.name}</span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <UsersIcon className="size-3.5" />
                    {team.memberCount} {team.memberCount === 1 ? 'member' : 'members'}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )
      )}

      <CreateTeamDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
