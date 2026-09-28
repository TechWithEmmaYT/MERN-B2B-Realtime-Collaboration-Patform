import {
  ChevronDownIcon,
  LinkIcon,
  MoreHorizontalIcon,
  PlayIcon,
  StarIcon,
} from 'lucide-react'
import { Link } from 'react-router'

import { BoardAvatarStack } from '@/components/board/board-avatar-stack'
import { BoardCommentsMenu, type ThreadFocus } from '@/components/board/board-comments-menu'
import { LogoMark } from '@/components/logo'
import { Button } from '@/components/ui/button'

type BoardHeaderProps = {
  title: string
  workspaceId: string
  onFocusThread: (thread: ThreadFocus) => void
}

export function BoardHeader({ title, workspaceId, onFocusThread }: BoardHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b bg-background px-4 py-2">
      <div className="flex min-w-0 items-center gap-1.5">
        <Link
          to={`/dashboard/org/${workspaceId}`}
          className="flex items-center gap-2 rounded-md px-1.5 py-0.5 hover:bg-muted"
        >
          <LogoMark className="size-6" />
          <span className="text-lg font-bold tracking-tight">kano</span>
        </Link>

        <button
          type="button"
          className="flex min-w-0 items-center gap-1 rounded-md px-2 py-1 text-sm font-medium hover:bg-muted"
        >
          <span className="truncate">{title}</span>
          <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
        </button>

        <StarIcon className="size-4 fill-primary text-primary" />
        <MoreHorizontalIcon className="size-4 text-muted-foreground" />
      </div>

      <div className="flex items-center gap-2">
        <BoardAvatarStack />

        <BoardCommentsMenu onFocusThread={onFocusThread} />

        <Button variant="outline" size="sm">
          <PlayIcon data-icon="inline-start" />
          Present
        </Button>

        <Button size="sm">
          <LinkIcon data-icon="inline-start" />
          Share
          <ChevronDownIcon data-icon="inline-end" />
        </Button>
      </div>
    </header>
  )
}
