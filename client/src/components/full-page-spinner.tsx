import { Spinner } from '@/components/ui/spinner'

export function FullPageSpinner() {
  return (
    <div className="flex min-h-svh bg-primary/50 items-center justify-center">
      <Spinner className="size-8" />
    </div>
  )
}
