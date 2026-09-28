import {
  ArrowRightIcon,
  ChevronDownIcon,
  LayoutTemplateIcon,
  MessageSquareIcon,
  MousePointerClickIcon,
  SparklesIcon,
  StarIcon,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, Navigate } from 'react-router'

import aiAgentFeature from '@/assets/landing/ai-agent-feature.png'
import boardScreenshot from '@/assets/landing/board-screenshot.png'
import commentFeature from '@/assets/landing/coment-feature.png'
import realtimeFeature from '@/assets/landing/realtime-feature.png'
import templatesFeature from '@/assets/landing/templates-feature.png'
import { FullPageSpinner } from '@/components/full-page-spinner'
import { Logo, LogoMark } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth-context'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Templates', href: '#templates' },
  { label: 'AI Agent', href: '#ai-agent' },
]

type Feature = {
  icon: LucideIcon
  title: string
  description: string
  screenshot: string
  id?: string
}

const FEATURES: Feature[] = [
  {
    icon: MousePointerClickIcon,
    title: 'Realtime canvas',
    description:
      'Everyone works on the same board at once. See cursors, edits and who is here, live.',
    screenshot: realtimeFeature,
  },
  {
    icon: LayoutTemplateIcon,
    title: 'Templates',
    description:
      'Start from a brainstorm, flowchart, roadmap or journey, not a blank page.',
    screenshot: templatesFeature,
    id: 'templates',
  },
  {
    icon: SparklesIcon,
    title: 'AI agent',
    description:
      'Tell the agent what to build and it adds notes, flows and frames right on the board.',
    screenshot: aiAgentFeature,
    id: 'ai-agent',
  },
  {
    icon: MessageSquareIcon,
    title: 'Comments & presence',
    description: 'Pin a comment anywhere and keep context on the object, not in a thread.',
    screenshot: commentFeature,
  },
]

const TESTIMONIALS = [
  {
    quote:
      'Kano replaced three tools for us. Our product and design teams finally plan in the same place.',
    name: 'Sarah Chen',
    role: 'Head of Product, Lumen',
  },
  {
    quote:
      'The AI agent genuinely feels like another teammate. It drafts the board while we talk through it.',
    name: 'David Okafor',
    role: 'Design Lead, Northwind',
  },
  {
    quote:
      'From zero to our first roadmap in under a minute. The templates alone were worth it.',
    name: 'Maria Lopes',
    role: 'Founder, Orbit',
  },
]

const FAQS = [
  {
    q: 'What is Kano?',
    a: 'Kano is a realtime whiteboard where teams brainstorm, map flows and plan roadmaps together, with an AI agent that builds alongside you.',
  },
  {
    q: 'Do I need to install anything?',
    a: 'No. Kano runs in your browser. Create a workspace and you are on a board in seconds.',
  },
  {
    q: 'How does the AI agent work?',
    a: 'Describe what you want and the agent adds sticky notes, flowcharts and roadmaps directly to the board. You can undo or edit anything it creates.',
  },
  {
    q: 'Can my whole team collaborate?',
    a: 'Yes. Invite your workspace, organize into teams, and everyone sees changes live as they happen.',
  },
  {
    q: 'Is there a free plan?',
    a: 'Yes. Start free, invite your team, and upgrade when you need more workspaces and members.',
  },
]

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function BrowserFrame({
  src,
  alt,
  className,
}: {
  src: string
  alt: string
  className?: string
}) {
  return (
    <div className={cn('overflow-hidden rounded-xl border bg-background', className)}>
      <div className="flex items-center gap-1.5 border-b bg-muted/50 px-4 py-2.5">
        <span className="size-3 rounded-full bg-[#FF5F57]" />
        <span className="size-3 rounded-full bg-[#FEBC2E]" />
        <span className="size-3 rounded-full bg-[#28C840]" />
      </div>
      <img src={src} alt={alt} className="w-full" />
    </div>
  )
}

// Reveals content with a soft fade + rise the first time it scrolls into view.
function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const node = ref.current
    if (!node || visible) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -48px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [visible])

  return (
    <div
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(
        'transition-[opacity,transform] duration-700 ease-out will-change-transform',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
        className,
      )}
    >
      {children}
    </div>
  )
}

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <FullPageSpinner />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  return (
    <div className="bg-canvas">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-4 py-5 sm:px-6">
        <Link to="/" aria-label="Kano home" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/sign-in">Log in</Link>
          </Button>
          <Button
            size="sm"
            className="rounded-full bg-foreground px-4 text-background hover:bg-foreground/85"
            asChild
          >
            <Link to="/sign-up">Get started</Link>
          </Button>
        </div>
      </header>

      <main className="flex flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        <Reveal className="flex flex-col items-center">
          <h1 className="max-w-4xl text-4xl font-semibold leading-[1.12] tracking-tight sm:text-5xl md:text-[3.5rem] md:leading-[1.08]">
            What if your{' '}
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary align-[-0.12em] sm:size-12 md:size-14">
              <LogoMark className="size-6 sm:size-7 md:size-8" />
            </span>{' '}
            whiteboard
            <br />
            could build with you
            <br />
            while your team works?
          </h1>

          <p className="mt-6 max-w-md text-base text-muted-foreground sm:text-lg">
            Kano is a realtime canvas where your team brainstorms, maps flows and plans roadmaps,
            with an{' '}
            <span className="rounded-md bg-primary/25 px-1.5 py-0.5 font-medium text-foreground underline decoration-primary decoration-2 underline-offset-2">
              AI agent&nbsp;→
            </span>{' '}
            right beside you.
          </p>

          <div className="mt-9 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
            <Button
              size="lg"
              className="h-11 w-full rounded-full bg-foreground px-6 text-background hover:bg-foreground/85 sm:w-auto"
              asChild
            >
              <Link to="/sign-up">Get started free</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-11 w-full rounded-full bg-background px-6 sm:w-auto"
              asChild
            >
              <a href="#product">See it in action&nbsp;›</a>
            </Button>
          </div>
        </Reveal>
      </main>

      <section id="product" className="relative mx-auto w-full max-w-5xl px-4 sm:px-6">
        <Reveal>
          <BrowserFrame
            src={boardScreenshot}
            alt="Kano board showing sticky notes, a flowchart, a roadmap and the AI agent panel"
            className="shadow-2xl shadow-foreground/[0.08]"
          />
        </Reveal>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-canvas to-transparent" />
      </section>

      <section id="features" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything your team needs to think together
            </h2>
            <p className="mt-4 text-muted-foreground">
              A realtime canvas, ready-made templates, and an AI agent that builds with you.
            </p>
          </div>
        </Reveal>

        <div className="mt-16 flex flex-col gap-16 sm:gap-24">
          {FEATURES.map((feature, index) => (
            <Reveal key={feature.title} delay={index * 60}>
              <div
                id={feature.id}
                className="grid scroll-mt-6 items-center gap-8 md:grid-cols-2 md:gap-12"
              >
                <div className={cn(index % 2 === 1 && 'md:order-2')}>
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/15">
                    <feature.icon className="size-5 text-foreground" />
                  </span>
                  <h3 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                    {feature.title}
                  </h3>
                  <p className="mt-3 max-w-md text-muted-foreground">{feature.description}</p>
                </div>
                <BrowserFrame
                  src={feature.screenshot}
                  alt={`${feature.title} screenshot`}
                  className={cn(
                    'shadow-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-md',
                    index % 2 === 1 && 'md:order-1',
                  )}
                />
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section
        id="testimonials"
        className="mx-auto w-full max-w-6xl px-4 pt-20 pb-10 sm:px-6 sm:pt-28 sm:pb-12"
      >
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Teams ship faster with Kano
            </h2>
            <p className="mt-4 text-muted-foreground">
              From first idea to a shared plan, without the tool switching.
            </p>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {TESTIMONIALS.map((testimonial) => (
              <figure
                key={testimonial.name}
                className="flex flex-col gap-5 rounded-xl border bg-background p-6 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex gap-0.5" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <StarIcon key={index} className="size-4 fill-primary text-primary" />
                  ))}
                </div>
                <blockquote className="text-sm leading-relaxed text-foreground">
                  “{testimonial.quote}”
                </blockquote>
                <figcaption className="mt-auto flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-foreground">
                    {initials(testimonial.name)}
                  </span>
                  <div>
                    <div className="text-sm font-medium">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </Reveal>
      </section>

      <section
        id="faq"
        className="mx-auto w-full max-w-6xl px-4 pt-10 pb-20 sm:px-6 sm:pt-12 sm:pb-28"
      >
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Questions, answered
            </h2>
            <p className="mt-4 text-muted-foreground">
              Everything you need to know before you start.
            </p>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="mx-auto mt-14 max-w-2xl divide-y overflow-hidden rounded-xl border bg-background">
            {FAQS.map((faq) => (
              <details key={faq.q} className="group px-6 py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium">
                  {faq.q}
                  <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
              </details>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="bg-foreground">
        <Reveal className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24">
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-background sm:text-4xl">
            Your next board is a minute away
          </h2>
          <p className="mt-4 max-w-md text-background/70">
            Start free, invite your team, and build together on one canvas.
          </p>
          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              className="h-11 rounded-full bg-primary px-8 text-primary-foreground hover:bg-primary/90"
              asChild
            >
              <Link to="/sign-up">
                Get started free
                <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
          </div>
        </Reveal>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <Logo showWordmark={false} markClassName="size-6" />
          <p>© {new Date().getFullYear()} Kano. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#faq" className="transition-colors hover:text-foreground">
              FAQ
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
