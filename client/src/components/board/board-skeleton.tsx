import { LogoMark } from '@/components/logo'
import { Skeleton } from '@/components/ui/skeleton'

const TOOL_COUNT = 9

// Mirrors the board page layout (header, floating toolbar, bottom bars) so the
// page doesn't jump when the board loads.
export function BoardSkeleton() {
  return (
    <div className="flex h-screen flex-col overflow-hidden" aria-busy="true" aria-label="Loading board">
      <header className="flex items-center justify-between border-b bg-background px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-1.5 opacity-40">
            <LogoMark className="size-6 grayscale" />
            <span className="text-lg font-bold tracking-tight">kano</span>
          </div>
          <Skeleton className="h-6 w-36" />
          <Skeleton className="size-5 rounded-sm" />
          <Skeleton className="size-5 rounded-sm" />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="size-7 rounded-full ring-2 ring-background" />
            ))}
          </div>
          <Skeleton className="size-8" />
          <Skeleton className="h-8 w-24" />
        </div>
      </header>

      <main className="canvas-surface relative flex-1 overflow-hidden">
        <div className="absolute left-3 top-3 flex w-14 flex-col items-center gap-1.5 rounded-xl border bg-background p-2 shadow-sm">
          <Skeleton className="size-9 rounded-lg bg-primary/30" />
          <span className="my-1 h-px w-6 bg-border" />
          {Array.from({ length: TOOL_COUNT }, (_, i) => (
            <Skeleton key={i} className="size-8 rounded-lg" />
          ))}
          <span className="my-1 h-px w-6 bg-border" />
          <Skeleton className="size-8 rounded-lg" />
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-1.5 rounded-lg border bg-background p-1.5 shadow-sm">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="size-7" />
            ))}
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border bg-background p-1.5 shadow-sm">
            <Skeleton className="size-7" />
            <Skeleton className="size-7" />
            <Skeleton className="h-7 w-12" />
            <Skeleton className="size-7" />
            <Skeleton className="size-7" />
          </div>
        </div>
      </main>
    </div>
  )
}
