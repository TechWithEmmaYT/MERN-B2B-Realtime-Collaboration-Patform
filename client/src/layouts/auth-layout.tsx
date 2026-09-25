import { LayoutGridIcon, SparklesIcon, UsersIcon } from 'lucide-react'

import authIllustration from '@/assets/illustrations/auth-illustration.png'
import { Logo } from '@/components/logo'

const highlights = [
  { icon: UsersIcon, title: 'Real-time', subtitle: 'collaboration' },
  { icon: SparklesIcon, title: 'AI that', subtitle: 'helps you build' },
  { icon: LayoutGridIcon, title: 'Templates', subtitle: 'to get started' },
]

type AuthLayoutProps = {
  eyebrow?: string
  title: React.ReactNode
  description: React.ReactNode
  children: React.ReactNode
  headerAction?: React.ReactNode
}

export function AuthLayout({
  eyebrow = 'Ideas. Plans. Together.',
  title,
  description,
  children,
  headerAction,
}: AuthLayoutProps) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <aside className="relative hidden flex-col justify-between gap-2 bg-primary p-10 lg:flex">
        <Logo />

        <div className="flex flex-col gap-6">
          <p className="text-xs -mt-1 font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">
            {eyebrow}
          </p>
          <h2 className="max-w-md text-5xl font-bold leading-[1.05] tracking-tight text-primary-foreground">
            {title}
          </h2>
          <p className="max-w-sm text-lg text-primary-foreground/80">{description}</p>

          <img
            src={authIllustration}
            alt=""
            className="-mt-6 w-full max-w-lg rounded-2xl"
          />
        </div>

        <ul className="flex items-center gap-8">
          {highlights.map(({ icon: Icon, title: heading, subtitle }) => (
            <li key={heading} className="flex items-center gap-2.5">
              <Icon className="size-5 shrink-0 text-primary-foreground" />
              <span className="text-[13px] leading-tight text-primary-foreground">
                {heading}
                <br />
                {subtitle}
              </span>
            </li>
          ))}
        </ul>
      </aside>

      <main className="cols-span-2 flex flex-col px-6 py-8 lg:px-16">
        <div className="flex justify-end">{headerAction}</div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  )
}
