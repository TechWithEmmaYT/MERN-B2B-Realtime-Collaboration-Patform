import { LayoutGridIcon, ListIcon, StarIcon, UsersIcon } from 'lucide-react'
import type { ComponentType } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type BoardView = 'grid' | 'list'

export type BoardGridItem = {
  id: string
  name: string
  description: string
  icon: ComponentType<{ className?: string }>
  iconClass: string
  memberCount: number
  lastOpened: string
  owner?: { name: string; initials: string; avatar?: string }
  starred?: boolean
}

// Card view of boards, used on Home and on a team's Boards tab.
export function BoardGrid({
  boards,
  onOpen,
}: {
  boards: BoardGridItem[]
  onOpen: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {boards.map((board) => (
        <button
          key={board.id}
          type="button"
          onClick={() => onOpen(board.id)}
          className="group flex flex-col overflow-hidden rounded-xl border bg-card text-left transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className={cn('relative flex h-28 items-center justify-center', board.iconClass)}>
            <board.icon className="size-9 transition group-hover:scale-110" />
            {board.starred ? (
              <StarIcon className="absolute right-3 top-3 size-4 fill-primary text-primary" />
            ) : null}
          </div>

          <div className="flex flex-col gap-2 p-3">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-sm font-medium">{board.name}</span>
              <span className="truncate text-xs text-muted-foreground">{board.description}</span>
            </div>

            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="flex min-w-0 items-center gap-1.5">
                {board.owner ? (
                  <>
                    <Avatar className="size-5">
                      {board.owner.avatar ? (
                        <AvatarImage src={board.owner.avatar} alt={board.owner.name} />
                      ) : null}
                      <AvatarFallback className="text-[9px] font-semibold">
                        {board.owner.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{board.lastOpened}</span>
                  </>
                ) : (
                  <span className="truncate">{board.lastOpened}</span>
                )}
              </span>
              <span className="flex shrink-0 items-center gap-1">
                <UsersIcon className="size-3.5" />
                {board.memberCount}
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

// Grid / list switch, matching the one on Home.
export function BoardViewToggle({
  view,
  onChange,
}: {
  view: BoardView
  onChange: (view: BoardView) => void
}) {
  return (
    <div className="flex items-center overflow-hidden rounded-lg border">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Grid view"
        aria-pressed={view === 'grid'}
        className={cn('rounded-none', view === 'grid' && 'bg-muted')}
        onClick={() => onChange('grid')}
      >
        <LayoutGridIcon />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="List view"
        aria-pressed={view === 'list'}
        className={cn('rounded-none border-l', view === 'list' && 'bg-muted')}
        onClick={() => onChange('list')}
      >
        <ListIcon />
      </Button>
    </div>
  )
}
