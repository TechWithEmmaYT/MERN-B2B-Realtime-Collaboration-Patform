import { useUser } from '@liveblocks/react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export const initialsOf = (name: string) =>
  // The agent reads "AI", not "AA" (from "AI Agent").
  name === 'AI Agent'
    ? 'AI'
    : name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]!.toUpperCase())
        .join('') || '?'

// One look for a person everywhere on the board (header stack, AI chat, …):
// their photo, or two-letter initials on their personal colour (same as their cursor).
export function UserAvatar({
  name,
  avatar,
  color,
  className,
}: {
  name: string
  avatar?: string | null
  color?: string
  className?: string
}) {
  return (
    <Avatar className={cn('size-7', className)}>
      {avatar ? <AvatarImage src={avatar} alt={name} /> : null}
      <AvatarFallback
        className="text-xs font-semibold text-white"
        style={{ backgroundColor: color ?? '#111111' }}
      >
        {initialsOf(name)}
      </AvatarFallback>
    </Avatar>
  )
}

// Same avatar, looked up by user id through Liveblocks `resolveUsers`, so it always
// matches the header even for messages saved earlier. Falls back to the given info.
export function ResolvedUserAvatar({
  userId,
  fallbackName,
  fallbackAvatar,
  className,
}: {
  userId: string
  fallbackName: string
  fallbackAvatar?: string
  className?: string
}) {
  const { user } = useUser(userId)
  return (
    <UserAvatar
      name={user?.name ?? fallbackName}
      avatar={user?.avatar ?? fallbackAvatar}
      color={user?.color}
      className={className}
    />
  )
}

export function useResolvedUserName(userId: string | undefined, fallback: string) {
  const { user } = useUser(userId ?? '')
  return (userId && user?.name) || fallback
}
