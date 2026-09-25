import { useQuery } from '@tanstack/react-query'
import { ArrowLeftIcon, StarIcon } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { FullPageSpinner } from '@/components/full-page-spinner'
import { LogoMark } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { getBoardQueryFn } from '@/lib/api'
import { cn } from '@/lib/utils'

export function BoardPage() {
  const { boardId } = useParams()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['board', boardId],
    queryFn: () => getBoardQueryFn(boardId!),
    enabled: !!boardId,
  })

  if (isLoading) return <FullPageSpinner />

  if (isError || !data?.board) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4">
        <p className="text-lg font-semibold">Board not found or you don&apos;t have access.</p>
        <Button variant="outline" asChild>
          <Link to="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    )
  }

  const { board } = data

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            asChild
            aria-label="Back to dashboard"
          >
            <Link to={`/dashboard/org/${board.workspaceId}`}>
              <ArrowLeftIcon />
            </Link>
          </Button>
          <LogoMark className="size-6" />
          <span className="truncate text-sm font-medium">{board.title}</span>
          <StarIcon
            className={cn(
              'size-4',
              board.isStarred ? 'fill-primary text-primary' : 'text-muted-foreground',
            )}
          />
        </div>
      </header>

      <main className="canvas-surface flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-lg font-semibold">{board.title}</p>
          <p className="text-sm text-muted-foreground">The canvas is coming soon.</p>
        </div>
      </main>
    </div>
  )
}
