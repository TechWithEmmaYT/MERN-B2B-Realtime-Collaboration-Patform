import { useOthers, useSelf } from '@liveblocks/react'

import { UserAvatar } from '@/components/board/user-avatar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function BoardAvatarStack() {
  const self = useSelf()
  const others = useOthers()

  const collaborators = [...(self ? [self] : []), ...others]
  const visible = collaborators.slice(0, 3)
  const overflow = collaborators.length - visible.length

  return (
    <div className="flex -space-x-2">
      {visible.map((user) => (
        <UserAvatar
          key={user.connectionId}
          name={user.info?.name ?? '?'}
          avatar={user.info?.avatar}
          color={user.info?.color}
          className="ring-2 ring-background"
        />
      ))}

      {overflow > 0 ? (
        <Avatar className="size-7 ring-2 ring-background">
          <AvatarFallback className="bg-muted text-xs font-semibold text-muted-foreground">
            +{overflow}
          </AvatarFallback>
        </Avatar>
      ) : null}
    </div>
  )
}
