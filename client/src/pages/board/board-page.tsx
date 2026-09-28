import { LiveMap } from '@liveblocks/client'
import { useQuery } from '@tanstack/react-query'
import {
  LiveblocksProvider,
  RoomProvider,
  useLostConnectionListener,
  useStatus,
} from '@liveblocks/react'
import { ReactFlowProvider } from '@xyflow/react'
import { EraserIcon, HighlighterIcon, PenIcon } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'

import { AiAgentPanel } from '@/components/board/ai-agent-panel'
import { BoardCanvas } from '@/components/board/board-canvas'
import { BoardHeader } from '@/components/board/board-header'
import { BoardSkeleton } from '@/components/board/board-skeleton'
import { BoardToolbar } from '@/components/board/board-toolbar'
import { ShapeIcon } from '@/components/board/nodes'
import { Button } from '@/components/ui/button'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  getBoardQueryFn,
  getBoardTemplateQueryFn,
  liveblocksAuthEndpoint,
  resolveWorkspaceUsersFn,
  searchWorkspaceMembersFn,
} from '@/lib/api'
import { strokeWidth } from '@/lib/board-draw'
import { cn } from '@/lib/utils'
import type { BoardDetail } from '@/types'
import {
  DRAW_COLORS,
  DRAW_MODES,
  NOTE_COLORS,
  SHAPE_MENU,
  STROKE_SIZES,
  type DrawToolMode,
  type FlowEdge,
  type FlowNode,
  type ShapeKind,
  type StrokeSize,
  type ToolId,
} from '@/types/flow'

// The server-side AI agent isn't a workspace member, so it's resolved here.
const AI_AGENT_ID = 'ai-agent'
const AI_AGENT_INFO = { name: 'AI Agent', avatar: '', color: '#FFD21F' }

export function BoardPage() {
  const { boardId } = useParams()

  const boardQuery = useQuery({
    queryKey: ['board', boardId],
    queryFn: () => getBoardQueryFn(boardId!),
    enabled: !!boardId,
  })

  const board = boardQuery.data?.board
  const templateKey = board?.templateKey

  // Fetch the template content so a freshly-created template board can be seeded.
  const templateQuery = useQuery({
    queryKey: ['board-template', templateKey],
    queryFn: () => getBoardTemplateQueryFn(templateKey!),
    enabled: !!templateKey && templateKey !== 'blank',
  })

  if (boardQuery.isLoading) return <BoardSkeleton />

  if (boardQuery.isError || !board) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4">
        <p className="text-lg font-semibold">Board not found or you don&apos;t have access.</p>
        <Button variant="outline" asChild>
          <Link to="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    )
  }

  // Wait for the template before opening the room, so the storage seeds correctly.
  if (templateKey && templateKey !== 'blank' && templateQuery.isLoading) {
    return <BoardSkeleton />
  }

  const initialNodes = templateQuery.data?.template.nodes ?? []
  const initialEdges = templateQuery.data?.template.edges ?? []

  return (
    <LiveblocksProvider
      authEndpoint={liveblocksAuthEndpoint}
      backgroundKeepAliveTimeout={15 * 60 * 1000}
      // Send updates every 16ms (~60 FPS) so drags and cursors look smooth to others.
      throttle={16}
      // Real names/avatars for comment authors, mentions and pins. Must return one
      // entry per id, in the same order (undefined for unknown users).
      resolveUsers={async ({ userIds }) => {
        const memberIds = userIds.filter((id) => id !== AI_AGENT_ID)
        try {
          const users = memberIds.length
            ? await resolveWorkspaceUsersFn(board.workspaceId, memberIds)
            : []
          const byId = new Map(users.map((user) => [user.id, user]))
          return userIds.map((id) =>
            id === AI_AGENT_ID ? AI_AGENT_INFO : byId.get(id),
          )
        } catch (error) {
          console.error('Failed to resolve users', error)
          return userIds.map(() => undefined)
        }
      }}
      resolveMentionSuggestions={async ({ text }) => {
        try {
          return await searchWorkspaceMembersFn(board.workspaceId, text)
        } catch (error) {
          console.error('Failed to load mention suggestions', error)
          return []
        }
      }}
    >
      <RoomProvider
        id={board.roomId}
        initialPresence={{ cursor: null, promptingFeedId: null }}
        initialStorage={{ images: new LiveMap() }}
      >
        <BoardRoom board={board} initialNodes={initialNodes} initialEdges={initialEdges} />
      </RoomProvider>
    </LiveblocksProvider>
  )
}

const CONNECTION_TOAST_ID = 'board-connection'

// Black toast with a white spinner (sonner draws its spinner bars with --gray11).
const connectingToastStyle = {
  background: '#000',
  color: '#fff',
  borderColor: '#000',
  '--gray11': 'rgba(255, 255, 255, 0.85)',
} as CSSProperties

function BoardRoom({
  board,
  initialNodes,
  initialEdges,
}: {
  board: BoardDetail
  initialNodes: FlowNode[]
  initialEdges: FlowEdge[]
}) {
  const [activeTool, setActiveTool] = useState<ToolId>('select')
  const [aiAgentOpen, setAiAgentOpen] = useState(false)
  const [noteColor, setNoteColor] = useState<string>(NOTE_COLORS[0])
  const [noteColorOpen, setNoteColorOpen] = useState(false)
  const [shapeType, setShapeType] = useState<ShapeKind>('rectangle')
  const [shapeMenuOpen, setShapeMenuOpen] = useState(false)
  const [drawMode, setDrawMode] = useState<DrawToolMode>('pen')
  const [drawSize, setDrawSize] = useState<StrokeSize>('medium')
  const [drawColor, setDrawColor] = useState<string>(DRAW_COLORS[0])
  const [drawMenuOpen, setDrawMenuOpen] = useState(false)
  const [focusedThreadId, setFocusedThreadId] = useState<string | null>(null)
  const [focusPan, setFocusPan] = useState<{ x: number; y: number } | null>(null)
  const status = useStatus()
  const isConnected = status === 'connected'

  const wasReconnecting = useRef(false)

  useEffect(() => {
    if (status === 'connected') {
      if (wasReconnecting.current) {
        toast.success('Connection restored', {
          id: CONNECTION_TOAST_ID,
          duration: 3000,
          style: undefined,
        })
      } else {
        toast.dismiss(CONNECTION_TOAST_ID)
      }
      wasReconnecting.current = false
      return
    }

    if (status === 'disconnected') return

    if (status === 'reconnecting') wasReconnecting.current = true
    toast.loading(status === 'reconnecting' ? 'Reconnecting…' : 'Connecting to board…', {
      id: CONNECTION_TOAST_ID,
      duration: Infinity,
      closeButton: true,
      style: connectingToastStyle,
    })
  }, [status])

  useEffect(() => () => void toast.dismiss(CONNECTION_TOAST_ID), [])

  useLostConnectionListener((event) => {
    if (event !== 'failed') return
    toast.error('Connection lost', {
      id: CONNECTION_TOAST_ID,
      description: 'Check your internet connection. Liveblocks will keep retrying.',
      duration: Infinity,
      closeButton: true,
      style: undefined,
    })
  })

  const handleToolChange = (tool: ToolId) => {
    setActiveTool(tool)
    setNoteColorOpen(tool === 'note')
    setShapeMenuOpen(tool === 'shape')
    setDrawMenuOpen(tool === 'draw')
  }

  // Keyboard shortcuts switch the tool directly, without opening a popover.
  const selectTool = useCallback(
    (tool: ToolId, shapeType?: ShapeKind) => {
      setActiveTool(tool)
      if (shapeType) setShapeType(shapeType)
      setNoteColorOpen(false)
      setShapeMenuOpen(false)
      setDrawMenuOpen(false)
    },
    [],
  )

  // Focus a thread from the header menu: open it and pan the canvas to its pin.
  const focusThread = useCallback((thread: { id: string; x: number; y: number }) => {
    setFocusedThreadId(thread.id)
    setFocusPan({ x: thread.x, y: thread.y })
  }, [])

  // Esc drops the current tool and goes back to Select (ignored while typing).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, [contenteditable="true"]')) return
      setActiveTool('select')
      setNoteColorOpen(false)
      setShapeMenuOpen(false)
      setDrawMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <fieldset
      disabled={!isConnected}
      aria-busy={!isConnected}
      className="contents [&_button:disabled]:pointer-events-none [&_button:disabled]:opacity-50 [&_input:disabled]:opacity-50"
    >
      <div className="flex h-screen flex-col overflow-hidden">
        <BoardHeader
          title={board.title}
          workspaceId={board.workspaceId}
          onFocusThread={focusThread}
        />

        <ReactFlowProvider>
          <div className="flex min-h-0 flex-1">
            <div className="relative min-h-0 flex-1">
              <BoardCanvas
              activeTool={activeTool}
              onToolChange={handleToolChange}
              onSelectTool={selectTool}
              noteColor={noteColor}
              shapeType={shapeType}
              drawMode={drawMode}
              drawSize={drawSize}
              drawColor={drawColor}
              initialNodes={initialNodes}
              initialEdges={initialEdges}
              focusedThreadId={focusedThreadId}
              onFocusChange={setFocusedThreadId}
              focusPan={focusPan}
              onFocusPanConsumed={() => setFocusPan(null)}
            />
            <BoardToolbar
              activeTool={activeTool}
              onToolChange={handleToolChange}
              aiAgentOpen={aiAgentOpen}
              onToggleAiAgent={() => setAiAgentOpen((open) => !open)}
            />

            <Popover open={noteColorOpen} onOpenChange={setNoteColorOpen}>
              <PopoverAnchor className="absolute left-[68px] top-3" />
              <PopoverContent
                side="right"
                align="start"
                sideOffset={8}
                className="w-auto p-2"
              >
                <div className="grid grid-cols-2 gap-2">
                  {NOTE_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Note colour ${color}`}
                      onClick={() => {
                        setNoteColor(color)
                        setNoteColorOpen(false)
                      }}
                      className={cn(
                        'size-10 rounded-lg border transition hover:scale-110',
                        noteColor === color && 'ring-2 ring-primary ring-offset-1',
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Popover open={shapeMenuOpen} onOpenChange={setShapeMenuOpen}>
              <PopoverAnchor className="absolute left-[68px] top-3" />
              <PopoverContent
                side="right"
                align="start"
                sideOffset={8}
                className="w-auto p-2"
              >
                <div className="flex min-w-40 flex-col gap-0.5">
                  {SHAPE_MENU.map((group, groupIndex) => (
                    <div key={group.label || `group-${groupIndex}`}>
                      {group.label ? (
                        <span className="px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          {group.label}
                        </span>
                      ) : null}
                      {group.items.map((item) => (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => {
                            setShapeType(item.type)
                            setShapeMenuOpen(false)
                          }}
                          className={cn(
                            'flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition hover:bg-muted',
                            shapeType === item.type && 'bg-muted',
                          )}
                        >
                          <ShapeIcon
                            type={item.type}
                            className="size-4 shrink-0 text-foreground/70"
                          />
                          <span className="flex-1">{item.label}</span>
                          {item.shortcut ? (
                            <kbd className="rounded border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {item.shortcut}
                            </kbd>
                          ) : null}
                        </button>
                      ))}
                      {groupIndex < SHAPE_MENU.length - 1 ? (
                        <Separator className="my-1" />
                      ) : null}
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Popover open={drawMenuOpen} onOpenChange={setDrawMenuOpen}>
              <PopoverAnchor className="absolute left-[68px] top-3" />
              <PopoverContent
                side="right"
                align="start"
                sideOffset={8}
                className="w-auto p-1.5"
              >
                <DrawMenu
                  mode={drawMode}
                  size={drawSize}
                  color={drawColor}
                  onModeChange={setDrawMode}
                  onSizeChange={setDrawSize}
                  onColorChange={setDrawColor}
                />
              </PopoverContent>
            </Popover>
            </div>

            {aiAgentOpen ? (
              <AiAgentPanel boardId={board.id} onClose={() => setAiAgentOpen(false)} />
            ) : null}
          </div>
        </ReactFlowProvider>
      </div>
    </fieldset>
  )
}

function DrawModeIcon({ mode }: { mode: DrawToolMode }) {
  if (mode === 'pen') return <PenIcon />
  if (mode === 'highlighter') return <HighlighterIcon />
  return <EraserIcon />
}

const SIZE_ORDER: StrokeSize[] = ['thin', 'medium', 'thick']

// Miro-style draw menu: a narrow icon-only column (labels live in tooltips).
function DrawMenu({
  mode,
  size,
  color,
  onModeChange,
  onSizeChange,
  onColorChange,
}: {
  mode: DrawToolMode
  size: StrokeSize
  color: string
  onModeChange: (mode: DrawToolMode) => void
  onSizeChange: (size: StrokeSize) => void
  onColorChange: (color: string) => void
}) {
  const nextSize = SIZE_ORDER[(SIZE_ORDER.indexOf(size) + 1) % SIZE_ORDER.length]!
  const sizeLabel = STROKE_SIZES.find((option) => option.id === size)?.label ?? 'Size'
  const dot = Math.max(strokeWidth(size, 'pen'), 3)

  return (
    <div className="flex w-10 flex-col items-center gap-1">
      {DRAW_MODES.map((option) => (
        <DrawMenuButton
          key={option.id}
          label={option.label}
          active={mode === option.id}
          onClick={() => onModeChange(option.id)}
        >
          <DrawModeIcon mode={option.id} />
        </DrawMenuButton>
      ))}

      <Separator className="my-1 !w-6" />

      <DrawMenuButton label={`Size: ${sizeLabel}`} onClick={() => onSizeChange(nextSize)}>
        <span className="flex size-6 items-center justify-center rounded-full border border-foreground/30">
          <span className="rounded-full bg-foreground" style={{ width: dot, height: dot }} />
        </span>
      </DrawMenuButton>

      <Separator className="my-1 !w-6" />

      {DRAW_COLORS.map((option) => (
        <DrawMenuButton
          key={option}
          label={`Colour ${option}`}
          disabled={mode === 'eraser'}
          onClick={() => onColorChange(option)}
        >
          <span
            className={cn(
              'size-6 rounded-full',
              color === option && 'ring-2 ring-primary ring-offset-2 ring-offset-popover',
            )}
            style={{ backgroundColor: option }}
          />
        </DrawMenuButton>
      ))}
    </div>
  )
}

function DrawMenuButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          aria-pressed={active}
          disabled={disabled}
          onClick={onClick}
          className={cn(
            'flex size-9 items-center justify-center rounded-lg text-foreground/70 transition [&_svg]:size-5 hover:bg-muted hover:text-foreground',
            active && 'bg-primary/20 text-foreground hover:bg-primary/20',
            disabled && 'pointer-events-none opacity-40',
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}
