import { ArrowRightIcon, CheckCircle2Icon, SparklesIcon, UsersIcon } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router'

import { AuthLayout } from '@/layouts/auth-layout'
import { LogoMark } from '@/components/logo'
import { OnboardingStepper } from '@/components/onboarding/onboarding-stepper'
import { Button } from '@/components/ui/button'

export default function WorkspaceReadyPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const invited = Number(searchParams.get('invited') ?? 0)

  const summary = [
    {
      icon: <LogoMark className="size-5" />,
      title: 'Workspace created',
      description: 'Your workspace is ready to use.',
    },
    {
      icon: <UsersIcon className="size-5" />,
      title: invited > 0 ? `${invited} teammates invited` : 'No invites sent yet',
      description:
        invited > 0
          ? 'Invitations have been sent to your teammates.'
          : 'You can invite teammates any time from the dashboard.',
    },
    {
      icon: <SparklesIcon className="size-5" />,
      title: 'You are all set',
      description: 'Start creating boards and bring your ideas to life.',
    },
  ]

  return (
    <AuthLayout
      title="You are all set!"
      description="Your workspace is ready. Start collaborating and turn your ideas into real progress."
    >
      <div className="flex flex-col gap-8">
        <OnboardingStepper current={3} />

        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary">
            <LogoMark className="size-9" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            Your workspace is ready!
          </h1>
          <p className="text-muted-foreground">
            You can now create boards, invite more teammates, and start
            collaborating with AI.
          </p>
        </div>

        <ul className="flex flex-col gap-4 rounded-xl border p-4">
          {summary.map((item) => (
            <li key={item.title} className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                {item.icon}
              </span>
              <span className="flex flex-1 flex-col">
                <span className="font-medium">{item.title}</span>
                <span className="text-sm text-muted-foreground">
                  {item.description}
                </span>
              </span>
              <CheckCircle2Icon className="size-5 shrink-0 text-primary" />
            </li>
          ))}
        </ul>

        <div className="flex flex-col items-center gap-4">
          <Button className="w-full" onClick={() => navigate('/dashboard')}>
            Go to dashboard
            <ArrowRightIcon data-icon="inline-end" />
          </Button>

          <Link
            to="/dashboard"
            className="text-sm text-muted-foreground underline"
          >
            Invite more people later
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}
