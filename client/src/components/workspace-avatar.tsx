import { cn } from '@/lib/utils'
import type { Workspace, WorkspaceIconColor } from '@/types'

export const workspaceIconColors: Record<WorkspaceIconColor, string> = {
  yellow: 'bg-primary text-primary-foreground',
  violet: 'bg-violet-200 text-violet-900',
  emerald: 'bg-emerald-200 text-emerald-900',
  pink: 'bg-pink-200 text-pink-900',
  sky: 'bg-sky-200 text-sky-900',
}

type WorkspaceAvatarProps = Pick<Workspace, 'iconType' | 'iconValue' | 'name'> & {
  iconColor?: WorkspaceIconColor
  className?: string
}

export function WorkspaceAvatar({
  iconType,
  iconValue,
  iconColor = 'yellow',
  name,
  className,
}: WorkspaceAvatarProps) {
  if (iconType === 'image' && iconValue) {
    return (
      <img
        src={iconValue}
        alt=""
        className={cn('size-8 shrink-0 rounded-lg object-cover', className)}
      />
    )
  }

  return (
    <span
      className={cn(
        'flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
        workspaceIconColors[iconColor] ?? workspaceIconColors.yellow,
        iconType === 'emoji' && 'text-base',
        className,
      )}
    >
      {iconType === 'emoji'
        ? iconValue
        : (iconValue || name.slice(0, 2)).toUpperCase()}
    </span>
  )
}
