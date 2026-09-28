import { ClientSideSuspense } from '@liveblocks/react'
import { useThreads } from '@liveblocks/react/suspense'
import { CommentPin, FloatingComposer, FloatingThread } from '@liveblocks/react-ui'
import { useNodes, useReactFlow, useViewport } from '@xyflow/react'
import { CheckIcon } from 'lucide-react'
import type { CSSProperties } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

// Where a pin goes. x/y are canvas coordinates; nodeId + offset attach it to a node.
export type CommentPosition = {
  x: number
  y: number
  nodeId?: string
  offsetX?: number
  offsetY?: number
}

type BoardCommentsProps = {
  // When set, render a draft FloatingComposer triggered by a transient pin at
  // these flow coordinates. Once the user submits or closes the composer we
  // drop the draft and the resulting thread takes over.
  draft: CommentPosition | null
  onDraftConsumed: () => void
  // Which thread is currently open (controlled). Set from the pin click or the
  // header comments menu.
  focusedThreadId: string | null
  onFocusChange: (threadId: string | null) => void
}

// React Flow's viewport is `pointer-events: none`, so pins must re-enable events
// and opt out of node dragging / canvas panning to stay clickable.
const PIN_CLASS = 'nodrag nopan pointer-events-auto'

export function BoardComments({
  draft,
  onDraftConsumed,
  focusedThreadId,
  onFocusChange,
}: BoardCommentsProps) {
  return (
    <ErrorBoundary fallback={null}>
      <ClientSideSuspense fallback={null}>
        <BoardCommentsInner
          draft={draft}
          onDraftConsumed={onDraftConsumed}
          focusedThreadId={focusedThreadId}
          onFocusChange={onFocusChange}
        />
      </ClientSideSuspense>
    </ErrorBoundary>
  )
}

function BoardCommentsInner({
  draft,
  onDraftConsumed,
  focusedThreadId,
  onFocusChange,
}: BoardCommentsProps) {
  const { threads } = useThreads()
  const { zoom } = useViewport()
  const { getInternalNode } = useReactFlow()
  // Subscribing to nodes re-renders pins when an attached node moves.
  useNodes()

  // A pin on a node follows the node's current position; if the node is gone it
  // stays where the comment was first placed.
  const pinStyle = (position: CommentPosition): CSSProperties => {
    const node = position.nodeId ? getInternalNode(position.nodeId) : undefined
    const origin = node?.internals.positionAbsolute
    return {
      position: 'absolute',
      left: origin ? origin.x + (position.offsetX ?? 0) : position.x,
      top: origin ? origin.y + (position.offsetY ?? 0) : position.y,
      // Undo the canvas zoom so pins stay the same size on screen.
      transform: `scale(${1 / zoom})`,
      transformOrigin: '0 0',
      // Inline on purpose: Liveblocks' pin CSS starts with `all: unset`, which makes it
      // inherit `pointer-events: none` from React Flow's viewport and overrides classes.
      pointerEvents: 'auto',
      // Above selected nodes (React Flow lifts them to z-index 1000), so pins stay visible.
      zIndex: 2000,
    }
  }

  return (
    <>
      {threads.map((thread) => (
        <FloatingThread
          key={thread.id}
          thread={thread}
          open={thread.id === focusedThreadId}
          onOpenChange={(open) => onFocusChange(open ? thread.id : null)}
        >
          <CommentPin
            userId={thread.comments[0]?.userId}
            corner="top-left"
            className={PIN_CLASS}
            style={pinStyle(thread.metadata)}
          >
            {thread.resolved ? <CheckIcon className="size-3" /> : undefined}
          </CommentPin>
        </FloatingThread>
      ))}

      {draft ? (
        <FloatingComposer
          metadata={draft}
          defaultOpen
          onOpenChange={(open) => {
            if (!open) onDraftConsumed()
          }}
        >
          <CommentPin
            corner="top-left"
            className={PIN_CLASS}
            style={pinStyle(draft)}
          />
        </FloatingComposer>
      ) : null}
    </>
  )
}
