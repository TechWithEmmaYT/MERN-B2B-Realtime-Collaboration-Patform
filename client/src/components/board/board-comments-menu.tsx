import { ClientSideSuspense } from '@liveblocks/react'
import { useThreads, useUser } from '@liveblocks/react/suspense'
import { MessageCircleIcon } from 'lucide-react'
import { useState, type ComponentProps } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type BoardThread = ReturnType<typeof useThreads>['threads'][number]

export type ThreadFocus = { id: string; x: number; y: number }

type BoardCommentsMenuProps = {
  onFocusThread: (thread: ThreadFocus) => void
}

export function BoardCommentsMenu({ onFocusThread }: BoardCommentsMenuProps) {
  return (
    <ErrorBoundary fallback={<CommentsButton openCount={0} />}>
      <ClientSideSuspense fallback={<CommentsButton openCount={0} />}>
        <BoardCommentsMenuInner onFocusThread={onFocusThread} />
      </ClientSideSuspense>
    </ErrorBoundary>
  )
}

function BoardCommentsMenuInner({ onFocusThread }: BoardCommentsMenuProps) {
  const { threads } = useThreads()
  const [tab, setTab] = useState<'open' | 'resolved'>('open')
  const [open, setOpen] = useState(false)

  const openThreads = threads.filter((thread) => !thread.resolved)
  const resolvedThreads = threads.filter((thread) => thread.resolved)
  const list = tab === 'open' ? openThreads : resolvedThreads

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <CommentsButton openCount={openThreads.length} />
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={6} className="w-80 p-0">
        <div className="flex items-center gap-1 border-b p-1.5">
          <TabButton active={tab === 'open'} onClick={() => setTab('open')}>
            Open ({openThreads.length})
          </TabButton>
          <TabButton active={tab === 'resolved'} onClick={() => setTab('resolved')}>
            Resolved ({resolvedThreads.length})
          </TabButton>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {list.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No {tab} comments
            </p>
          ) : (
            list.map((thread) => (
              <ThreadListItem
                key={thread.id}
                thread={thread}
                onClick={() => {
                  onFocusThread({ id: thread.id, x: thread.metadata.x, y: thread.metadata.y })
                  setOpen(false)
                }}
              />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function CommentsButton({
  openCount,
  className,
  ...props
}: { openCount: number } & ComponentProps<'button'>) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Comments"
      className={cn('relative', className)}
      {...props}
    >
      <MessageCircleIcon />
      {openCount > 0 ? (
        <Badge className="pointer-events-none absolute -right-1 -top-1 h-4 min-w-4 px-1 text-[10px]">
          {openCount}
        </Badge>
      ) : null}
    </Button>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 rounded-md px-2 py-1 text-sm font-medium transition',
        active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50',
      )}
    >
      {children}
    </button>
  )
}

function ThreadListItem({ thread, onClick }: { thread: BoardThread; onClick: () => void }) {
  const firstComment = thread.comments[0]
  const replyCount = Math.max(0, thread.comments.length - 1)
  const text =
    firstComment && 'body' in firstComment
      ? commentText(firstComment.body)
      : '(deleted comment)'

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition hover:bg-muted"
    >
      {firstComment ? <CommentAuthorAvatar userId={firstComment.userId} /> : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          {firstComment ? (
            <CommentAuthorName userId={firstComment.userId} />
          ) : (
            <span className="text-sm font-medium">Deleted</span>
          )}
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatRelativeTime(thread.createdAt)}
          </span>
        </div>
        <p className="mt-0.5 truncate text-sm text-foreground/90">{text}</p>
        {replyCount > 0 ? (
          <span className="text-xs text-muted-foreground">
            {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
          </span>
        ) : null}
      </div>
    </button>
  )
}

function CommentAuthorAvatar({ userId }: { userId: string }) {
  const { user } = useUser(userId)
  return (
    <Avatar size="sm" className="mt-0.5">
      {user?.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
      <AvatarFallback>{user?.name?.charAt(0) ?? '?'}</AvatarFallback>
    </Avatar>
  )
}

function CommentAuthorName({ userId }: { userId: string }) {
  const { user } = useUser(userId)
  return <span className="truncate text-sm font-medium">{user?.name ?? 'Unknown'}</span>
}

function commentText(body: unknown): string {
  if (!body || typeof body !== 'object') return ''
  const content = (body as { content?: unknown }).content
  if (!Array.isArray(content)) return ''

  const parts: string[] = []
  for (const block of content) {
    const children = (block as { children?: unknown }).children
    if (!Array.isArray(children)) continue
    for (const child of children) {
      if (child && typeof child === 'object' && 'text' in child && typeof child.text === 'string') {
        parts.push(child.text)
      } else if (child && typeof child === 'object' && 'type' in child && child.type === 'link') {
        const link = child as { url?: string; text?: string }
        parts.push(link.text ?? link.url ?? '')
      }
    }
  }
  return parts.join(' ').trim()
}

function formatRelativeTime(date: Date): string {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}
