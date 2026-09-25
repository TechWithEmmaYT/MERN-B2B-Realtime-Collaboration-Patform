import { useMutation } from '@tanstack/react-query'
import { ArrowRightIcon, MailIcon, PlusIcon, XIcon } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'

import { AuthLayout } from '@/layouts/auth-layout'
import { OnboardingStepper } from '@/components/onboarding/onboarding-stepper'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { sendInvitesMutationFn } from '@/lib/api'
import type { WorkspaceRole } from '@/types'

type InviteRow = {
  id: string
  email: string
  role: WorkspaceRole
}

const createRow = (role: WorkspaceRole = 'member'): InviteRow => ({
  id: crypto.randomUUID(),
  email: '',
  role,
})

const roleOptions: { value: WorkspaceRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Editor' },
]

export default function InviteTeamPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const workspaceId = searchParams.get('workspaceId') ?? ''

  const [defaultRole, setDefaultRole] = useState<WorkspaceRole>('member')
  const [rows, setRows] = useState<InviteRow[]>([
    createRow(),
    createRow(),
  ])

  const { mutate, isPending } = useMutation({
    mutationFn: sendInvitesMutationFn,
    onSuccess: ({ invited }) =>
      navigate(
        `/onboarding/ready?workspaceId=${workspaceId}&invited=${invited.length}`,
      ),
    onError: (error: { message: string }) => toast.error(error.message),
  })

  const updateRow = (id: string, patch: Partial<InviteRow>) =>
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    )

  const removeRow = (id: string) =>
    setRows((current) =>
      current.length === 1 ? current : current.filter((row) => row.id !== id),
    )

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    const invites = rows
      .map((row) => ({ email: row.email.trim(), role: row.role }))
      .filter((row) => row.email.length > 0)

    if (invites.length === 0) {
      toast.error('Add at least one email, or skip for now.')
      return
    }

    mutate({ workspaceId, invites, defaultRole })
  }

  const skip = () => navigate(`/onboarding/ready?workspaceId=${workspaceId}`)

  return (
    <AuthLayout
      title={
        <>
          Great teams
          <br />
          build greater things.
        </>
      }
      description="Invite your teammates and start collaborating on the same canvas."
      headerAction={
        <Button variant="outline" size="sm" onClick={skip}>
          Skip for now
        </Button>
      }
    >
      <div className="flex flex-col gap-8">
        <OnboardingStepper current={2} />

        <div className="flex flex-col gap-1.5">
          <h1 className="text-4xl font-bold tracking-tight">
            Bring your team with you
          </h1>
          <p className="text-muted-foreground">
            Invite your teammates to collaborate on Kano. You can always invite more
            people later.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <Field>
            <FieldLabel>Email addresses</FieldLabel>
            <div className="flex flex-col gap-3">
              {rows.map((row) => (
                <div key={row.id} className="flex items-center gap-2">
                  <InputGroup className="flex-1">
                    <InputGroupAddon>
                      <MailIcon />
                    </InputGroupAddon>
                    <InputGroupInput
                      type="email"
                      placeholder="name@company.com"
                      value={row.email}
                      onChange={(event) =>
                        updateRow(row.id, { email: event.target.value })
                      }
                    />
                  </InputGroup>

                  <Select
                    value={row.role}
                    onValueChange={(value) =>
                      updateRow(row.id, { role: value as WorkspaceRole })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {roleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove invite"
                    onClick={() => removeRow(row.id)}
                  >
                    <XIcon />
                  </Button>
                </div>
              ))}
            </div>
          </Field>

          <Button
            type="button"
            variant="secondary"
            className="self-start"
            onClick={() => setRows((current) => [...current, createRow(defaultRole)])}
          >
            <PlusIcon data-icon="inline-start" />
            Add another person
          </Button>

          <div className="flex items-center justify-between gap-4">
            <Field className="gap-1">
              <FieldLabel htmlFor="default-role">Default role</FieldLabel>
              <FieldDescription>
                New members will be added as editors.
              </FieldDescription>
            </Field>

            <Select
              value={defaultRole}
              onValueChange={(value) => setDefaultRole(value as WorkspaceRole)}
            >
              <SelectTrigger id="default-role" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <Spinner data-icon="inline-start" /> : null}
            Send invites
            <ArrowRightIcon data-icon="inline-end" />
          </Button>

          <button
            type="button"
            onClick={skip}
            className="text-sm text-muted-foreground underline"
          >
            Skip for now
          </button>
        </form>
      </div>
    </AuthLayout>
  )
}
