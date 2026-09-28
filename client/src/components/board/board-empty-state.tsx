import { ArrowUpIcon, SparklesIcon } from 'lucide-react'

import { boardTemplates } from '@/components/boards/board-templates'

const templates = boardTemplates.filter((template) => template.id !== 'blank')

const suggestions = [
  'Create a user flow for a mobile app',
  'Brainstorm features for a SaaS',
  'Build a product roadmap',
]

export function BoardEmptyState({
  onSelectTemplate,
}: {
  onSelectTemplate: (key: string) => void
}) {
  return (
    <div className="pointer-events-auto flex flex-col items-center gap-8 px-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="text-3xl font-semibold tracking-tight">
          What do you want to create?
        </h2>
        <p className="text-muted-foreground text-base">
          Start from a template, use AI, or build from scratch.
        </p>
      </div>

      <div className="grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelectTemplate(template.id)}
            className="group flex flex-col items-center gap-2 rounded-xl border bg-background p-3 text-left transition hover:border-foreground/20 hover:shadow-sm"
          >
            <span className="flex h-24 w-full items-center justify-center overflow-hidden rounded-lg border bg-muted/40 p-2.5">
              {template.illustration}
            </span>
            <span className="text-sm font-medium">{template.name}</span>
          </button>
        ))}
      </div>

      <div className="flex w-full max-w-xl flex-col gap-3">
        <div className="flex items-center gap-2 rounded-xl border bg-background p-2 shadow-sm">
          <SparklesIcon className="size-5 shrink-0 text-muted-foreground" />
          <input
            type="text"
            placeholder="Ask AI to create anything..."
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            aria-label="Send"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"
          >
            <ArrowUpIcon className="size-4" />
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="rounded-full border px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-muted"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}