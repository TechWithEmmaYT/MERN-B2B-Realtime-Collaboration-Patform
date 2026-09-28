import { useState } from 'react'
import { toast } from 'sonner'

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
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
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
import type { SendInvitesResponse, WorkspaceRole } from '@/types'

const ROLE_OPTIONS: { value: WorkspaceRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
]

type InviteMembersDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInvite: (email: string, role: WorkspaceRole) => Promise<SendInvitesResponse>
}

export function InviteMembersDialog({ open, onOpenChange, onInvite }: InviteMembersDialogProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<WorkspaceRole>('member')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const value = email.trim()
    if (!value) return

    setSubmitting(true)
    try {
      const result = await onInvite(value, role)
      if (result.invited.length > 0) {
        toast.success(`Invitation sent to ${value}`)
      } else {
        toast.info(`${value} is already a member or has a pending invite`)
      }
      setEmail('')
      setRole('member')
      onOpenChange(false)
    } catch (error) {
      toast.error((error as { message?: string }).message ?? 'Could not send invitation')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-6 p-3">
            <DialogHeader>
              <DialogTitle>Invite members</DialogTitle>
              <DialogDescription>
                Invite teammates to your workspace. They&apos;ll get an email with a link to
                join.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="invite-email">Email address</FieldLabel>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoFocus
                />
              </Field>

              <Field>
                <FieldLabel>Role</FieldLabel>
                <Select value={role} onValueChange={(value) => setRole(value as WorkspaceRole)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {ROLE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={submitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!email.trim() || submitting}>
              {submitting ? <Spinner data-icon="inline-start" /> : null}
              Send invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}