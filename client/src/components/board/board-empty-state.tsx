import { ArrowUpIcon, SparklesIcon } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { boardTemplates } from '@/components/boards/board-templates'

const templates = boardTemplates.filter((template) => template.id !== 'blank')

const suggestions = [
  'Create a user flow for a mobile app',
  'Brainstorm features for a SaaS',
  'Build a product roadmap',
]

export function BoardEmptyState({
  onSelectTemplate,
  onAskAi,
}: {
  onSelectTemplate: (key: string) => void
  // Opens the AI panel and sends the prompt in a new chat.
  onAskAi: (prompt: string) => void
}) {
  const [prompt, setPrompt] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const text = prompt.trim()
    if (!text) return
    onAskAi(text)
    setPrompt('')
  }

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

      <div className="grid w-full max-w-4xl grid-cols-2 gap-3 sm:grid-cols-5">
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
        <form
          onSubmit={submit}
          className="flex items-center gap-2 rounded-xl border bg-background p-2 shadow-sm"
        >
          <SparklesIcon className="size-5 shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Ask AI to create anything..."
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={!prompt.trim()}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition disabled:opacity-40"
          >
            <ArrowUpIcon className="size-4" />
          </button>
        </form>

        <div className="flex flex-wrap justify-center gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onAskAi(suggestion)}
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