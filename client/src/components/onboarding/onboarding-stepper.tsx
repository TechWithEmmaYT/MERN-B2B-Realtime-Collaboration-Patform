import { CheckIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

const steps = [
  { id: 1, label: 'Create workspace' },
  { id: 2, label: 'Invite team' },
  { id: 3, label: 'All set' },
]

export function OnboardingStepper({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-3">
      {steps.map((step, index) => {
        const isComplete = step.id < current
        const isActive = step.id === current

        return (
          <li key={step.id} className="flex flex-1 items-center gap-3">
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                isComplete && 'bg-muted text-muted-foreground',
                isActive && 'bg-primary text-primary-foreground',
                !isComplete && !isActive && 'bg-muted text-muted-foreground',
              )}
            >
              {isComplete ? <CheckIcon className="size-4" /> : step.id}
            </span>

            <span
              className={cn(
                'whitespace-nowrap text-sm',
                isActive ? 'font-medium text-foreground' : 'text-muted-foreground',
              )}
            >
              {step.label}
            </span>

            {index < steps.length - 1 ? (
              <span className="h-px flex-1 bg-border" aria-hidden="true" />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
