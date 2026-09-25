import { cn } from '@/lib/utils'

type LogoMarkProps = React.SVGProps<SVGSVGElement> & {
  tone?: 'default' | 'inverted'
}

export function LogoMark({ className, tone = 'default', ...props }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 100 82"
      role="img"
      aria-label="Kano"
      className={cn('size-8', className)}
      {...props}
    >
      <path
        d="M50 10C38 10 31 19 31 31C20 31 12 39 12 50C12 63 22 72 35 72C41 72 46 69 50 64C54 69 59 72 65 72C78 72 88 63 88 50C88 39 80 31 69 31C69 19 62 10 50 10Z"
        className={cn(
          tone === 'inverted' ? 'fill-background' : 'fill-foreground',
          'stroke-primary',
        )}
        strokeWidth={8}
        strokeLinejoin="round"
      />
      <ellipse
        cx="40"
        cy="40"
        rx="7"
        ry="9"
        className={tone === 'inverted' ? 'fill-foreground' : 'fill-background'}
      />
    </svg>
  )
}

type LogoProps = {
  className?: string
  markClassName?: string
  tone?: 'default' | 'inverted'
  showWordmark?: boolean
}

export function Logo({
  className,
  markClassName,
  tone = 'default',
  showWordmark = true,
}: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark tone={tone} className={cn('size-8', markClassName)} />
      {showWordmark ? (
        <span
          className={cn(
            'text-2xl font-bold tracking-tight',
            tone === 'inverted' ? 'text-background' : 'text-foreground',
          )}
        >
          kano
        </span>
      ) : null}
    </span>
  )
}
