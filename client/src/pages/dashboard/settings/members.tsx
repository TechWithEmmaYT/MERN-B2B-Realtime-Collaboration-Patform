import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ClockIcon,
  MailIcon,
  MoreVerticalIcon,
  SearchIcon,
  UserMinusIcon,
  UserPlusIcon,
  XIcon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { toast } from 'sonner'

import { InviteMembersDialog } from '@/components/dashboard/invite-members-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/context/auth-context'
import {
  getMyWorkspacesQueryFn,
  getPendingInvitesQueryFn,
  getWorkspaceMembersQueryFn,
  removeMemberMutationFn,
  revokeInvitationMutationFn,
  sendInvitesMutationFn,
  updateMemberRoleMutationFn,
} from '@/lib/api'
import type { PendingInvite, WorkspaceMember, WorkspaceRole } from '@/types'

const ROLE_OPTIONS: { value: WorkspaceRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
]

const MAX_TEAM_CHIPS = 2

// Stable empty references so `useMemo` deps don't change every render.
const EMPTY_MEMBERS: WorkspaceMember[] = []
const EMPTY_INVITES: PendingInvite[] = []

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

export function WorkspaceMembersPage() {
  const { workspaceId } = useParams()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [tab, setTab] = useState('members')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [search, setSearch] = useState('')

  const { data: workspacesData } = useQuery({
    queryKey: ['my-workspaces'],
    queryFn: getMyWorkspacesQueryFn,
  })
  const workspace = workspacesData?.workspaces.find((w) => w.id === workspaceId)
  const workspaceName = workspace?.name
  const canManage = workspace?.role === 'owner' || workspace?.role === 'admin'

  const membersQuery = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => getWorkspaceMembersQueryFn(workspaceId!),
    enabled: !!workspaceId,
  })
  const members = membersQuery.data?.members ?? EMPTY_MEMBERS

  const invitesQuery = useQuery({
    queryKey: ['workspace-invites', workspaceId],
    queryFn: () => getPendingInvitesQueryFn(workspaceId!),
    enabled: !!workspaceId,
  })
  const invites = invitesQuery.data?.invitations ?? EMPTY_INVITES

  const updateRole = useMutation({
    mutationFn: updateMemberRoleMutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] }),
    onError: (error: { message: string }) => toast.error(error.message),
  })

  const removeMember = useMutation({
    mutationFn: removeMemberMutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] })
      toast.success('Member removed from workspace')
    },
    onError: (error: { message: string }) => toast.error(error.message),
  })

  const revokeInvite = useMutation({
    mutationFn: revokeInvitationMutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['workspace-invites', workspaceId] }),
    onError: (error: { message: string }) => toast.error(error.message),
  })

  const invite = useMutation({
    mutationFn: sendInvitesMutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['workspace-invites', workspaceId] }),
  })

  const query = search.trim().toLowerCase()
  const filteredMembers = useMemo(
    () =>
      query
        ? members.filter(
            (m) =>
              m.name.toLowerCase().includes(query) || m.email.toLowerCase().includes(query),
          )
        : members,
    [members, query],
  )
  const filteredInvites = useMemo(
    () => (query ? invites.filter((i) => i.email.toLowerCase().includes(query)) : invites),
    [invites, query],
  )

  const changeMemberRole = (id: string, role: WorkspaceRole) =>
    updateRole.mutate({ workspaceId: workspaceId!, userId: id, role })

  const handleRemoveMember = (id: string) =>
    removeMember.mutate({ workspaceId: workspaceId!, userId: id })

  const cancelInvite = (id: string) =>
    revokeInvite.mutate({ workspaceId: workspaceId!, invitationId: id })

  const handleInvite = (email: string, role: WorkspaceRole) =>
    invite.mutateAsync({ workspaceId: workspaceId!, invites: [{ email, role }], defaultRole: role })

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Settings &amp; members</h1>
          <p className="text-muted-foreground">
            Manage who has access to {workspaceName ?? 'this workspace'}.
          </p>
        </div>

        {canManage ? (
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlusIcon data-icon="inline-start" />
            Invite
          </Button>
        ) : null}
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
            <TabsTrigger value="invites">Pending invites ({invites.length})</TabsTrigger>
          </TabsList>

          <InputGroup className="w-full max-w-xs">
            <InputGroupAddon align="inline-start">
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              placeholder={tab === 'members' ? 'Search members…' : 'Search invites…'}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </InputGroup>
        </div>

        <TabsContent value="members" className="pt-4">
          {membersQuery.isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Spinner className="size-6" />
            </div>
          ) : (
            <div className="flex flex-col divide-y rounded-lg border">
              <div className="hidden items-center gap-3 px-4 py-2 text-xs font-medium text-muted-foreground md:flex">
                <span className="flex-1">Member</span>
                <span className="w-56">Teams</span>
                <span className="w-28">Joined</span>
                <span className="w-28">Role</span>
                <span className="w-8" />
              </div>

              {filteredMembers.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                  {query ? `No members match "${search}".` : 'No members yet.'}
                </p>
              ) : (
                filteredMembers.map((member) => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    isSelf={member.id === user?.id}
                    canManage={canManage}
                    onChangeRole={(role) => changeMemberRole(member.id, role)}
                    onRemove={() => handleRemoveMember(member.id)}
                  />
                ))
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="invites" className="pt-4">
          {invitesQuery.isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Spinner className="size-6" />
            </div>
          ) : filteredInvites.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-12 text-center">
              <MailIcon className="size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {query
                  ? `No invites match "${search}".`
                  : 'No pending invites. Invite teammates to get them on the canvas.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col divide-y rounded-lg border">
              {filteredInvites.map((invite) => (
                <div key={invite.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <MailIcon className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{invite.email}</p>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <ClockIcon className="size-3" />
                      Invited {formatDate(invite.invitedAt)}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {invite.role === 'admin' ? 'Admin' : 'Member'}
                  </Badge>
                  {canManage ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Revoke invite"
                      onClick={() => cancelInvite(invite.id)}
                    >
                      <XIcon />
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <InviteMembersDialog open={inviteOpen} onOpenChange={setInviteOpen} onInvite={handleInvite} />
    </div>
  )
}

function MemberRow({
  member,
  isSelf,
  canManage,
  onChangeRole,
  onRemove,
}: {
  member: WorkspaceMember
  isSelf: boolean
  canManage: boolean
  onChangeRole: (role: WorkspaceRole) => void
  onRemove: () => void
}) {
  const isOwner = member.role === 'owner'
  const extraTeams = member.teams.length - MAX_TEAM_CHIPS

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Avatar>
        <AvatarFallback>{initials(member.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-medium">
          <span className="truncate">{member.name}</span>
          {isSelf ? <Badge variant="secondary">You</Badge> : null}
        </p>
        <p className="truncate text-sm text-muted-foreground">{member.email}</p>
      </div>

      <div className="hidden w-56 flex-wrap items-center gap-1 md:flex">
        {member.teams.slice(0, MAX_TEAM_CHIPS).map((team) => (
          <Badge key={team} variant="outline" className="font-normal">
            {team}
          </Badge>
        ))}
        {extraTeams > 0 ? (
          <Badge
            variant="outline"
            className="font-normal text-muted-foreground"
            title={member.teams.slice(MAX_TEAM_CHIPS).join(', ')}
          >
            +{extraTeams}
          </Badge>
        ) : null}
      </div>

      <span className="hidden w-28 text-sm text-muted-foreground md:block">
        {formatDate(member.joinedAt)}
      </span>

      <div className="w-28">
        {isOwner ? (
          <Badge variant="secondary">Owner</Badge>
        ) : (
          <RoleSelect
            value={member.role}
            onChange={onChangeRole}
            disabled={!canManage}
          />
        )}
      </div>

      <div className="w-8">
        {isOwner || !canManage ? null : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Actions for ${member.name}`}
                className="text-muted-foreground"
              >
                <MoreVerticalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem variant="destructive" onSelect={onRemove}>
                <UserMinusIcon />
                Remove from workspace
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}

function RoleSelect({
  value,
  onChange,
  disabled,
}: {
  value: WorkspaceRole
  onChange: (role: WorkspaceRole) => void
  disabled?: boolean
}) {
  return (
    <Select
      value={value}
      onValueChange={(role) => onChange(role as WorkspaceRole)}
      disabled={disabled}
    >
      <SelectTrigger size="sm" className="w-28">
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
  )
}