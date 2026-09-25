import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

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
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { teamInitials, useTeams } from '@/context/teams-context'

type CreateTeamDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateTeamDialog({ open, onOpenChange }: CreateTeamDialogProps) {
  const { teams, createTeam, selectTeam, isCreatingTeam } = useTeams()

  const schema = z.object({
    name: z
      .string()
      .trim()
      .min(2, 'Team name must be at least 2 characters')
      .max(40, 'Keep it under 40 characters')
      .refine(
        (name) => !teams.some((team) => team.name.toLowerCase() === name.toLowerCase()),
        'A team with this name already exists',
      ),
  })

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  })

  useEffect(() => {
    if (open) form.reset({ name: '' })
  }, [open, form])

  const name = form.watch('name')
  const error = form.formState.errors.name

  const onSubmit = form.handleSubmit(async ({ name }) => {
    try {
      const team = await createTeam(name)
      selectTeam(team.id)
      toast.success(`${team.name} created`)
      onOpenChange(false)
    } catch (error) {
      toast.error((error as { message?: string }).message ?? 'Could not create team')
    }
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isCreatingTeam) onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-6 p-3">
            <DialogHeader>
              <DialogTitle>Create a team</DialogTitle>
              <DialogDescription>
                Teams group people and their boards. Only team members can open a team's
                boards.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup>
              <Field data-invalid={!!error || undefined}>
                <FieldLabel htmlFor="team-name">Team name</FieldLabel>
                <div className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                    {teamInitials(name) || 'T'}
                  </span>
                  <Input
                    id="team-name"
                    placeholder="e.g. Design Team"
                    autoFocus
                    aria-invalid={!!error || undefined}
                    {...form.register('name')}
                  />
                </div>
                {error ? (
                  <FieldError>{error.message}</FieldError>
                ) : (
                  <FieldDescription>You'll be added as the first member.</FieldDescription>
                )}
              </Field>
            </FieldGroup>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isCreatingTeam}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isCreatingTeam}>
              {isCreatingTeam ? <Spinner data-icon="inline-start" /> : null}
              Create team
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
