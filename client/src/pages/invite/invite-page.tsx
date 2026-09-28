import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LogOutIcon } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'

import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { CURRENT_USER_QUERY_KEY, useAuth } from '@/context/auth-context'
import {
  acceptInviteMutationFn,
  logoutMutationFn,
  previewInviteQueryFn,
} from '@/lib/api'

export default function InvitePage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['invite', token],
    queryFn: () => previewInviteQueryFn(token!),
    enabled: !!token,
    retry: false,
  })

  const invitation = data?.invitation

  const accept = useMutation({
    mutationFn: () => acceptInviteMutationFn(token!),
    onSuccess: ({ workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: ['my-workspaces'] })
      toast.success(`Welcome to ${invitation?.workspaceName ?? 'your workspace'}`)
      navigate(`/dashboard/org/${workspaceId}`, { replace: true })
    },
    onError: (error: { message: string }) => toast.error(error.message),
  })

  const logout = useMutation({
    mutationFn: logoutMutationFn,
    onSuccess: () => queryClient.setQueryData(CURRENT_USER_QUERY_KEY, null),
  })

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  }

  const signInTo = `/sign-in?redirect=${encodeURIComponent(`/invite/${token}`)}`
  const signUpTo = `/sign-up?redirect=${encodeURIComponent(`/invite/${token}`)}`

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 px-6">
      <Logo />

      <div className="w-full max-w-md rounded-xl border bg-card p-8 text-card-foreground">
        {isError || !invitation ? (
          <InviteState
            title="Invitation unavailable"
            description="This invitation link is invalid or has expired."
          />
        ) : invitation.status === 'revoked' ? (
          <InviteState
            title="Invitation revoked"
            description="This invitation has been revoked. Ask the workspace owner to send you a new one."
          />
        ) : invitation.status === 'accepted' ? (
          <InviteState
            title="Already joined"
            description="This invitation has already been used."
          />
        ) : invitation.expired ? (
          <InviteState
            title="Invitation expired"
            description="This invitation has expired. Ask the workspace owner to send you a new one."
          />
        ) : !isAuthenticated ? (
          <div className="flex flex-col gap-5 text-center">
            <div className="flex flex-col gap-2">
              <h1 className="text-xl font-semibold tracking-tight">
                {invitation.inviterName} invited you to join {invitation.workspaceName}
              </h1>
              <p className="text-sm text-muted-foreground">
                {invitation.teamName
                  ? `You'll join ${invitation.teamName} on Kano.`
                  : 'Sign in to collaborate on Kano.'}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link to={signInTo}>Sign in</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to={signUpTo}>Create account</Link>
              </Button>
            </div>
          </div>
        ) : user && user.email !== invitation.email ? (
          <div className="flex flex-col gap-5 text-center">
            <div className="flex flex-col gap-2">
              <h1 className="text-xl font-semibold tracking-tight">Wrong account</h1>
              <p className="text-sm text-muted-foreground">
                This invitation was sent to <span className="font-medium">{invitation.email}</span>,
                but you&apos;re signed in as{' '}
                <span className="font-medium">{user.email}</span>.
              </p>
            </div>
            <Button
              variant="outline"
              disabled={logout.isPending}
              onClick={() => logout.mutate()}
            >
              {logout.isPending ? <Spinner data-icon="inline-start" /> : <LogOutIcon data-icon="inline-start" />}
              Sign out
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-5 text-center">
            <div className="flex flex-col gap-2">
              <h1 className="text-xl font-semibold tracking-tight">
                Join {invitation.workspaceName}
              </h1>
              <p className="text-sm text-muted-foreground">
                {invitation.inviterName} invited you
                {invitation.teamName ? ` to ${invitation.teamName}` : ''}. You&apos;ll be added
                to the workspace and its General team.
              </p>
            </div>
            <Button disabled={accept.isPending} onClick={() => accept.mutate()}>
              {accept.isPending ? <Spinner data-icon="inline-start" /> : null}
              Accept invitation
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function InviteState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-2 text-center">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}