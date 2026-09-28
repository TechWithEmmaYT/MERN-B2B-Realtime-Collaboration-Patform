import { useFileUrl } from '@liveblocks/react'
import { createContext, useContext, useEffect, useRef } from 'react'
import { Handle, NodeResizer, Position, type NodeProps } from '@xyflow/react'
import { Loader2Icon } from 'lucide-react'

import { smoothPath, strokeOpacity, strokeWidth } from '@/lib/board-draw'
import { cn } from '@/lib/utils'
import { TEXT_SHAPES, type FlowNode, type ShapeKind } from '@/types/flow'

type BoardNodeContextValue = {
  editingNodeId: string | null
  setNodeLabel: (id: string, label: string) => void
  setNodeColor: (id: string, color: string) => void
  finishEditing: () => void
  isConnecting: boolean
}

export const BoardNodeContext = createContext<BoardNodeContextValue | null>(null)

export function useBoardNode() {
  const context = useContext(BoardNodeContext)
  if (!context) throw new Error('useBoardNode must be used inside BoardNodeContext.Provider')
  return context
}

const SHAPE_STYLES: Record<string, string> = {
  rectangle: 'rounded-md',
  oval: 'rounded-[50%]',
  // Drawn with clip-path (not a rotated square) so it resizes with the node.
  rhombus: '[clip-path:polygon(50%_0,100%_50%,50%_100%,0_50%)]',
  triangle: '[clip-path:polygon(50%_0,100%_100%,0_100%)]',
}

// Gap between the node's visible body and the resize box around it.
const NODE_INSET = 'p-1.5'

// Dark note colours (e.g. black) need light text.
function isDarkColor(hex: string) {
  const value = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16))
  return (0.299 * r! + 0.587 * g! + 0.114 * b!) / 255 < 0.5
}

// Nodes without a stored size get a default one. This must be a real width/height,
// not min-width/min-height: the inner `size-full` body can't resolve a percentage
// height against a parent that only has a min-height, so it would collapse.
function fallbackSize(
  width: number | undefined,
  height: number | undefined,
  defaults: { width: number; height: number },
) {
  return {
    width: width ? undefined : defaults.width,
    height: height ? undefined : defaults.height,
  }
}

function BoardResizer({
  selected,
  minWidth,
  minHeight,
  keepAspectRatio,
}: {
  selected: boolean
  minWidth: number
  minHeight: number
  keepAspectRatio?: boolean
}) {
  return (
    <NodeResizer
      isVisible={selected}
      minWidth={minWidth}
      minHeight={minHeight}
      keepAspectRatio={keepAspectRatio}
      color="var(--primary)"
      lineClassName="!border-primary"
      handleClassName="!size-2.5 !rounded-full !border-2 !border-primary !bg-background"
    />
  )
}

const HANDLES = [
  { id: 'top', position: Position.Top },
  { id: 'right', position: Position.Right },
  { id: 'bottom', position: Position.Bottom },
  { id: 'left', position: Position.Left },
] as const

// Four connection points (top/right/bottom/left), each a source + target pair so it
// can start or end an arrow. Hidden until the node is hovered or the Connector tool
// is active. Source handles sit on top so dragging to start a connection works.
function NodeHandles() {
  const { isConnecting } = useBoardNode()
  const className = cn(
    '!size-2.5 rounded-full border-2 border-primary !bg-background transition-opacity',
    'opacity-0 group-hover:opacity-100',
    isConnecting && 'opacity-100 !size-3.5 !bg-primary',
  )

  return (
    <>
      {HANDLES.map(({ id, position }) => (
        <Handle
          key={`target-${id}`}
          type="target"
          id={id}
          position={position}
          className={className}
        />
      ))}
      {HANDLES.map(({ id, position }) => (
        <Handle
          key={`source-${id}`}
          type="source"
          id={id}
          position={position}
          className={cn(className, 'z-10')}
        />
      ))}
    </>
  )
}

function EditableText({
  value,
  onChange,
  onFinish,
  className,
}: {
  value: string
  onChange: (value: string) => void
  onFinish: () => void
  className?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    ref.current?.focus()
    ref.current?.select()
  }, [])

  return (
    <textarea
      ref={ref}
      value={value}
      rows={3}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onFinish}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          onFinish()
        }
      }}
      className={cn(
        // nodrag/nopan/nowheel: typing or selecting text must not drag or pan the canvas.
        'nodrag nopan nowheel size-full resize-none bg-transparent text-foreground outline-none',
        className,
      )}
    />
  )
}

export function ShapeIcon({ type, className }: { type: ShapeKind; className?: string }) {
  const stroke = 'currentColor'
  const props = { viewBox: '0 0 24 24', className, fill: 'none', stroke, strokeWidth: 1.8 }

  switch (type) {
    case 'line':
      return <svg {...props}><line x1="3" y1="12" x2="21" y2="12" /></svg>
    case 'arrow':
      return (
        <svg {...props}>
          <line x1="3" y1="12" x2="17" y2="12" />
          <polygon points="16,7 21,12 16,17" fill={stroke} stroke="none" />
        </svg>
      )
    case 'elbow-arrow':
      return (
        <svg {...props}>
          <path d="M3 20 V6 H16" />
          <polygon points="15,11 20,6 15,1" fill={stroke} stroke="none" />
        </svg>
      )
    case 'block-arrow':
      return (
        <svg {...props}>
          <polygon points="3,8 16,8 16,4 22,12 16,20 16,16 3,16" strokeLinejoin="round" />
        </svg>
      )
    case 'rectangle':
      return <svg {...props}><rect x="3" y="5" width="18" height="14" rx="2" /></svg>
    case 'oval':
      return <svg {...props}><ellipse cx="12" cy="12" rx="9" ry="7" /></svg>
    case 'rhombus':
      return <svg {...props}><path d="M12 3 L21 12 L12 21 L3 12 Z" /></svg>
    case 'triangle':
      return <svg {...props}><path d="M12 4 L21 19 L3 19 Z" /></svg>
    case 'divider':
      return <svg {...props}><line x1="3" y1="12" x2="21" y2="12" strokeWidth="3" /></svg>
    case 'diagram':
      return (
        <svg {...props}>
          <rect x="4" y="4" width="7" height="7" rx="1" />
          <rect x="13" y="4" width="7" height="7" rx="1" />
          <rect x="4" y="13" width="7" height="7" rx="1" />
          <rect x="13" y="13" width="7" height="7" rx="1" />
        </svg>
      )
    default:
      return null
  }
}

const LINE_VIEWBOXES: Record<string, string> = {
  line: '0 0 120 24',
  arrow: '0 0 120 24',
  'elbow-arrow': '0 0 80 64',
  'block-arrow': '0 0 120 40',
  divider: '0 0 140 16',
}

function LineShape({ shape, color }: { shape: ShapeKind; color: string }) {
  const stroke = '#111111'

  if (shape === 'diagram') {
    return (
      <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5">
        <rect x="4" y="4" width="7" height="7" rx="1" />
        <rect x="13" y="4" width="7" height="7" rx="1" />
        <rect x="4" y="13" width="7" height="7" rx="1" />
        <rect x="13" y="13" width="7" height="7" rx="1" />
      </svg>
    )
  }

  const viewBox = LINE_VIEWBOXES[shape] ?? '0 0 120 24'

  return (
    <svg viewBox={viewBox} className="h-full w-full" preserveAspectRatio="none">
      {shape === 'line' ? <line x1="4" y1="12" x2="116" y2="12" stroke={stroke} strokeWidth="2.5" /> : null}
      {shape === 'divider' ? <line x1="4" y1="8" x2="136" y2="8" stroke={stroke} strokeWidth="3" /> : null}
      {shape === 'arrow' ? (
        <>
          <line x1="4" y1="12" x2="102" y2="12" stroke={stroke} strokeWidth="2" />
          <polygon points="100,6 118,12 100,18" fill={stroke} />
        </>
      ) : null}
      {shape === 'elbow-arrow' ? (
        <>
          <path d="M4 58 V8 H62" fill="none" stroke={stroke} strokeWidth="2" />
          <polygon points="54,13 66,8 54,3" fill={stroke} />
        </>
      ) : null}
      {shape === 'block-arrow' ? (
        <polygon points="0,10 92,10 92,4 120,20 92,36 92,30 0,30" fill={color} stroke={stroke} strokeWidth="1.5" />
      ) : null}
    </svg>
  )
}

function NoteNode({ id, data, selected, width, height }: NodeProps<FlowNode>) {
  const { editingNodeId, setNodeLabel, finishEditing } = useBoardNode()
  const editing = editingNodeId === id

  return (
    <div
      className={cn('group size-full', NODE_INSET)}
      style={fallbackSize(width, height, { width: 168, height: 168 })}
    >
      {/* Sticky notes stay square, like Miro. */}
      <BoardResizer selected={selected} minWidth={120} minHeight={120} keepAspectRatio />
      <NodeHandles />
      <div
        className="size-full overflow-hidden rounded-md p-3 text-sm shadow-[0_1px_2px_rgb(0_0_0/0.06),0_8px_16px_-6px_rgb(0_0_0/0.06)]"
        style={{
          backgroundColor: data.color ?? '#FDE68A',
          color: isDarkColor(data.color ?? '#FDE68A') ? '#FFFFFF' : '#1F1F1F',
        }}
      >
        {editing ? (
          <EditableText
            value={data.label}
            onChange={(value) => setNodeLabel(id, value)}
            onFinish={finishEditing}
            className="text-inherit"
          />
        ) : (
          <p className="whitespace-pre-wrap break-words">{data.label}</p>
        )}
      </div>
    </div>
  )
}

function TextNode({ id, data, selected, width, height }: NodeProps<FlowNode>) {
  const { editingNodeId, setNodeLabel, finishEditing } = useBoardNode()
  const editing = editingNodeId === id

  return (
    <div
      className={cn('group size-full', NODE_INSET)}
      style={fallbackSize(width, height, { width: 140, height: 44 })}
    >
      <BoardResizer selected={selected} minWidth={60} minHeight={32} />
      <NodeHandles />
      <div className="size-full overflow-hidden px-1 text-base">
        {editing ? (
          <EditableText
            value={data.label}
            onChange={(value) => setNodeLabel(id, value)}
            onFinish={finishEditing}
          />
        ) : (
          <p className="whitespace-pre-wrap break-words">{data.label}</p>
        )}
      </div>
    </div>
  )
}

function ShapeNode({ id, data, selected, width, height }: NodeProps<FlowNode>) {
  const { editingNodeId, setNodeLabel, finishEditing } = useBoardNode()
  const editing = editingNodeId === id
  const shape = data.shape ?? 'rectangle'
  const color = data.color ?? '#93C5FD'
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  if (!TEXT_SHAPES.includes(shape)) {
    return (
      <div
        className={cn('group size-full', NODE_INSET)}
        style={fallbackSize(width, height, { width: 152, height: 64 })}
      >
        <BoardResizer selected={selected} minWidth={48} minHeight={24} />
        <NodeHandles />
        <div className="flex size-full items-center justify-center overflow-hidden">
          <LineShape shape={shape} color={color} />
        </div>
      </div>
    )
  }

  const isRhombus = shape === 'rhombus'

  return (
    <div
      className={cn('group size-full', NODE_INSET)}
      style={fallbackSize(width, height, isRhombus ? { width: 120, height: 120 } : { width: 152, height: 92 })}
    >
      <BoardResizer selected={selected} minWidth={60} minHeight={40} />
      <NodeHandles />
      <div
        className={cn(
          'flex size-full items-center justify-center overflow-hidden p-3 text-sm',
          SHAPE_STYLES[shape] ?? SHAPE_STYLES.rectangle,
          isRhombus && 'px-[22%]',
        )}
        // Light text on dark fills (e.g. the black decision diamond).
        style={{ backgroundColor: color, color: isDarkColor(color) ? '#FFFFFF' : '#1F1F1F' }}
      >
        {editing ? (
          <input
            ref={inputRef}
            value={data.label}
            onChange={(event) => setNodeLabel(id, event.target.value)}
            onBlur={finishEditing}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault()
                finishEditing()
              }
            }}
            className="nodrag nopan w-full min-w-0 bg-transparent text-center text-inherit outline-none"
          />
        ) : (
          <span className="whitespace-pre-wrap break-words text-center">{data.label}</span>
        )}
      </div>
    </div>
  )
}

function PathNode({ data, selected, width, height }: NodeProps<FlowNode>) {
  const points = data.points ?? []
  const color = data.color ?? '#1F1F1F'
  const mode = data.mode ?? 'pen'
  const size = data.size ?? 'medium'
  const d = smoothPath(points)
  // The box the points were drawn in; the viewBox maps it onto the node's current
  // size, so resizing scales the drawing.
  const drawnWidth = Math.max(8, ...points.map((p) => p.x))
  const drawnHeight = Math.max(8, ...points.map((p) => p.y))

  return (
    // No NODE_INSET here: the stroke must stay exactly where it was drawn.
    <div className="group size-full" style={fallbackSize(width, height, { width: 80, height: 80 })}>
      <BoardResizer selected={selected} minWidth={20} minHeight={20} />
      <NodeHandles />
      <svg
        className="size-full overflow-visible"
        viewBox={`0 0 ${drawnWidth} ${drawnHeight}`}
        preserveAspectRatio="none"
      >
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth(size, mode)}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={strokeOpacity(mode)}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  )
}

function ImageNode({ data, selected, width, height }: NodeProps<FlowNode>) {
  return (
    <div
      className={cn('group size-full', NODE_INSET)}
      style={fallbackSize(width, height, { width: 240, height: 180 })}
    >
      <BoardResizer selected={selected} minWidth={40} minHeight={40} />
      <NodeHandles />
      <div className="flex size-full items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
        {data.fileId ? (
          <ImageContent fileId={data.fileId} />
        ) : (
          <ImageStatus label="Uploading…" />
        )}
      </div>
    </div>
  )
}

function ImageContent({ fileId }: { fileId: string }) {
  const { url, error } = useFileUrl(fileId)
  useEffect(() => {
    if (error) console.error('Image failed to load', fileId, error)
  }, [error, fileId])
  if (error) return <ImageStatus label="Failed to load" />
  if (!url) return <ImageStatus label="Previewing…" />
  return (
    <img src={url} alt="" draggable={false} className="size-full select-none object-contain" />
  )
}

function ImageStatus({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 text-xs text-muted-foreground">
      <Loader2Icon className="size-4 animate-spin" />
      <span>{label}</span>
    </div>
  )
}

// Frame background choices; 'transparent' shows only a dashed outline.
const FRAME_COLORS = ['#FFFFFF', '#FEF9C3', '#DBEAFE', '#DCFCE7', '#FCE7F3', '#EDE9FE', 'transparent']

function FrameNode({ id, data, selected, width, height }: NodeProps<FlowNode>) {
  const { editingNodeId, setNodeLabel, setNodeColor, finishEditing } = useBoardNode()
  const editing = editingNodeId === id
  const inputRef = useRef<HTMLInputElement>(null)
  const color = data.color ?? '#FEF9C3'
  const transparent = color === 'transparent'

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  return (
    <div className="group relative size-full" style={fallbackSize(width, height, { width: 400, height: 440 })}>
      <BoardResizer selected={selected} minWidth={200} minHeight={140} />
      <NodeHandles />

      {/* Title sits above the frame, like Miro. */}
      <div className="absolute -top-7 left-0 flex max-w-full items-center gap-2">
        {editing ? (
          <input
            ref={inputRef}
            value={data.label}
            onChange={(event) => setNodeLabel(id, event.target.value)}
            onBlur={finishEditing}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault()
                finishEditing()
              }
            }}
            className="nodrag nopan min-w-0 bg-transparent text-sm font-medium text-foreground outline-none"
          />
        ) : (
          <span className="select-none truncate text-sm font-medium text-foreground/70">
            {data.label || 'Frame'}
          </span>
        )}
      </div>

      <div
        className={cn(
          'size-full rounded-md',
          transparent
            ? 'border-2 border-dashed border-foreground/25'
            : 'border border-black/15 shadow-[0_1px_2px_rgb(0_0_0/0.05),0_4px_12px_-6px_rgb(0_0_0/0.12)]',
        )}
        style={{ backgroundColor: transparent ? 'transparent' : color }}
      />

      {/* Colour picker, shown while the frame is selected. */}
      {selected ? (
        <div className="nodrag nopan absolute -top-9 right-0 flex items-center gap-1 rounded-full border bg-background p-1 shadow-sm">
          {FRAME_COLORS.map((option) => (
            <button
              key={option}
              type="button"
              aria-label={option === 'transparent' ? 'Transparent' : `Frame colour ${option}`}
              onClick={() => setNodeColor(id, option)}
              className={cn(
                'size-4 rounded-full border border-black/15',
                color === option && 'ring-2 ring-primary ring-offset-1',
              )}
              style={
                option === 'transparent'
                  ? {
                      backgroundImage:
                        'linear-gradient(45deg,#d4d4d8 25%,transparent 25%,transparent 75%,#d4d4d8 75%),linear-gradient(45deg,#d4d4d8 25%,#fff 25%,#fff 75%,#d4d4d8 75%)',
                      backgroundSize: '6px 6px',
                      backgroundPosition: '0 0,3px 3px',
                    }
                  : { backgroundColor: option }
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export const nodeTypes = {
  note: NoteNode,
  text: TextNode,
  shape: ShapeNode,
  path: PathNode,
  image: ImageNode,
  frame: FrameNode,
}
