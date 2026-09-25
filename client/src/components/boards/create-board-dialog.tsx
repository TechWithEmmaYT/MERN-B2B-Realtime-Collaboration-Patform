import { zodResolver } from '@hookform/resolvers/zod'
import { CheckIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import {
  boardTemplates,
  getBoardTemplate,
  type BoardTemplateId,
} from '@/components/boards/board-templates'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { teamInitials, useTeams } from '@/context/teams-context'
import { cn } from '@/lib/utils'

const schema = z.object({
  templateId: z.enum(['blank', 'brainstorm', 'flowchart', 'roadmap', 'journey']),
  title: z.string().trim().max(80, 'Keep the title under 80 characters'),
  teamId: z.string().min(1, 'Pick a team'),
  description: z.string().trim().max(200, 'Keep it under 200 characters'),
})

export type CreateBoardValues = {
  templateId: BoardTemplateId
  title: string
  teamId: string
  description: string
}

type CreateBoardDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTemplateId?: BoardTemplateId
  onCreate: (values: CreateBoardValues) => Promise<void>
}

export function CreateBoardDialog({
  open,
  onOpenChange,
  defaultTemplateId = 'blank',
  onCreate,
}: CreateBoardDialogProps) {
  const { teams, selectedTeam } = useTeams()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreateBoardValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      templateId: defaultTemplateId,
      title: '',
      teamId: selectedTeam?.id ?? '',
      description: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        templateId: defaultTemplateId,
        title: '',
        teamId: selectedTeam?.id ?? '',
        description: '',
      })
    }
  }, [open, defaultTemplateId, selectedTeam?.id, form])

  const templateId = form.watch('templateId')
  const titlePlaceholder =
    templateId === 'blank' ? 'Untitled board' : getBoardTemplate(templateId).name
  const { errors } = form.formState

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true)
    try {
      await onCreate({ ...values, title: values.title || titlePlaceholder })
      onOpenChange(false)
    } catch (error) {
      toast.error((error as { message?: string }).message ?? 'Could not create board')
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isSubmitting) onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-6 p-3">
            <DialogHeader>
              <DialogTitle>Create a board</DialogTitle>
              <DialogDescription>
                Pick a starting point. Everyone in the team can edit it with you and the AI
                agent.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup>
              <FieldSet>
                <FieldLegend variant="label">Start from</FieldLegend>
                <Controller
                  control={form.control}
                  name="templateId"
                  render={({ field }) => (
                    <div
                      role="radiogroup"
                      aria-label="Board template"
                      className="grid grid-cols-2 gap-3 sm:grid-cols-5"
                    >
                      {boardTemplates.map((template) => {
                        const selected = field.value === template.id
                        return (
                          <button
                            key={template.id}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => field.onChange(template.id)}
                            className="group flex flex-col gap-1.5 text-left"
                          >
                            <span
                              className={cn(
                                'relative flex h-20 items-center justify-center overflow-hidden rounded-lg border p-2.5 transition',
                                template.id === 'blank'
                                  ? 'bg-amber-50 dark:bg-primary/10'
                                  : 'bg-muted/40',
                                selected
                                  ? 'border-primary ring-2 ring-primary/40'
                                  : 'group-hover:border-foreground/20',
                              )}
                            >
                              {template.illustration}
                              {selected ? (
                                <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                  <CheckIcon className="size-3" />
                                </span>
                              ) : null}
                            </span>
                            <span className="truncate text-xs font-medium">
                              {template.name}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                />
              </FieldSet>

              <div className="grid gap-4 sm:grid-cols-[1fr_14rem]">
                <Field data-invalid={!!errors.title || undefined}>
                  <FieldLabel htmlFor="board-title">Board name</FieldLabel>
                  <Input
                    id="board-title"
                    placeholder={titlePlaceholder}
                    autoFocus
                    aria-invalid={!!errors.title || undefined}
                    {...form.register('title')}
                  />
                  {errors.title ? <FieldError>{errors.title.message}</FieldError> : null}
                </Field>

                <Field data-invalid={!!errors.teamId || undefined}>
                  <FieldLabel htmlFor="board-team">Team</FieldLabel>
                  <Controller
                    control={form.control}
                    name="teamId"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="board-team" className="w-full">
                          <SelectValue placeholder="Select a team" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {teams.map((team) => (
                              <SelectItem key={team.id} value={team.id}>
                                <span className="flex size-5 items-center justify-center rounded bg-muted text-[9px] font-bold">
                                  {teamInitials(team.name)}
                                </span>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.teamId ? <FieldError>{errors.teamId.message}</FieldError> : null}
                </Field>
              </div>

              <Field data-invalid={!!errors.description || undefined}>
                <FieldLabel htmlFor="board-description">
                  Description{' '}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </FieldLabel>
                <Textarea
                  id="board-description"
                  rows={2}
                  placeholder="What is this board for?"
                  aria-invalid={!!errors.description || undefined}
                  {...form.register('description')}
                />
                {errors.description ? (
                  <FieldError>{errors.description.message}</FieldError>
                ) : null}
              </Field>
            </FieldGroup>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
              Create board
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
