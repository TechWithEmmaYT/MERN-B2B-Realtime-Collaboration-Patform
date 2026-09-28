import { UserPlusIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'

export type TeamMemberOption = {
  id: string
  name: string
  email: string
}

type AddTeamMembersResult = {
  added: string[]
  skipped: string[]
}

type AddTeamMembersDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  available: TeamMemberOption[]
  onAdd: (ids: string[]) => Promise<AddTeamMembersResult>
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')

export function AddTeamMembersDialog({
  open,
  onOpenChange,
  available,
  onAdd,
}: AddTeamMembersDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [submitting, setSubmitting] = useState(false)

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const handleAdd = async () => {
    const ids = [...selected]
    setSubmitting(true)
    try {
      const result = await onAdd(ids)
      if (result.added.length > 0) {
        toast.success(
          `${result.added.length} ${result.added.length === 1 ? 'member' : 'members'} added to team`,
        )
      } else {
        toast.info('Those members are already in the team')
      }
      onOpenChange(false)
    } catch (error) {
      toast.error((error as { message?: string }).message ?? 'Could not add members')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setSelected(new Set())
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col gap-4 p-3">
          <DialogHeader>
            <DialogTitle>Add members</DialogTitle>
            <DialogDescription>
              Add existing workspace members to this team.
            </DialogDescription>
          </DialogHeader>

          <Command className="rounded-lg border">
            <CommandInput placeholder="Search members..." />
            <CommandList>
              <CommandEmpty>No workspace members found.</CommandEmpty>
              {available.map((member) => (
                <CommandItem
                  key={member.id}
                  value={`${member.name} ${member.email}`}
                  onSelect={() => toggle(member.id)}
                >
                  <Checkbox
                    checked={selected.has(member.id)}
                    onCheckedChange={() => {}}
                    className="pointer-events-none"
                  />
                  <Avatar className="size-7">
                    <AvatarFallback className="text-xs">
                      {initials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">{member.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {member.email}
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={submitting}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleAdd} disabled={selected.size === 0 || submitting}>
            {submitting ? <Spinner data-icon="inline-start" /> : <UserPlusIcon data-icon="inline-start" />}
            Add {selected.size > 0 ? `(${selected.size})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}