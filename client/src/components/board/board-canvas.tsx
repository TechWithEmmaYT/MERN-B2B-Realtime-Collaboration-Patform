import { Cursors, useLiveblocksFlow } from '@liveblocks/react-flow'
import { LiveMap, type LiveFile } from '@liveblocks/client'
import {
  useCanRedo,
  useCanUndo,
  useMutation,
  shallow,
  useOther,
  useOthers,
  useRedo,
  useStatus,
  useUndo,
  useUploadFile,
} from '@liveblocks/react'
import { Cursor } from '@liveblocks/react-ui'
import {
  Background,
  BackgroundVariant,
  MarkerType,
  SelectionMode,
  ReactFlow,
  useReactFlow,
  useViewport,
  ViewportPortal,
  type NodeChange,
} from '@xyflow/react'
import {
  HistoryIcon,
  LayoutGridIcon,
  MaximizeIcon,
  MinusIcon,
  PlusIcon,
  Redo2Icon,
  Undo2Icon,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties, type MouseEvent, type PointerEvent } from 'react'
import { toast } from 'sonner'

import { BoardComments, type CommentPosition } from '@/components/board/board-comments'
import { BoardEmptyState } from '@/components/board/board-empty-state'
import { BoardNodeContext, nodeTypes } from '@/components/board/nodes'
import { eraserCursor, getBoardCursor, getBoardNodeCursor } from '@/lib/board-cursor'
import { smoothPath, strokeOpacity, strokeWidth } from '@/lib/board-draw'
import { getBoardTemplateQueryFn } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  SHAPE_COLORS,
  TEXT_SHAPES,
  type BoardContextItem,
  type DrawToolMode,
  type FlowEdge,
  type FlowNode,
  type ShapeKind,
  type StrokePoint,
  type StrokeSize,
  type ToolId,
} from '@/types/flow'

import './board-cursor.css'
import '@xyflow/react/dist/style.css'
import '@liveblocks/react-ui/styles.css'
import '@liveblocks/react-flow/styles.css'

const ADD_TOOLS: ToolId[] = ['note', 'text', 'shape']

const FRAME_DEFAULT_COLOR = '#FEF9C3' // light yellow, 2nd frame colour

const NOTE_SIZE = 168

const SHAPE_SIZES: Partial<Record<ShapeKind, { width: number; height: number }>> = {
  rectangle: { width: 160, height: 100 },
  oval: { width: 160, height: 100 },
  rhombus: { width: 120, height: 120 },
  triangle: { width: 130, height: 114 },
  divider: { width: 200, height: 24 },
}
const LINE_SIZE = { width: 160, height: 48 }

// Shapes that are drawn as a line: dragging sets their length, not a box.
const LINE_SHAPES: ShapeKind[] = ['line', 'arrow', 'elbow-arrow', 'block-arrow', 'divider']
const MIN_SHAPE_SIZE = 24
// A press that moves less than this (in screen px) is a click: default size.
const CLICK_TOLERANCE = 5

type FlowPoint = { x: number; y: number }

type ShapeDraft = {
  start: FlowPoint
  end: FlowPoint
  startScreen: FlowPoint
  endScreen: FlowPoint
  square: boolean
}

const draftMoved = (draft: ShapeDraft) =>
  Math.hypot(draft.endScreen.x - draft.startScreen.x, draft.endScreen.y - draft.startScreen.y) >=
  CLICK_TOLERANCE

// The box the user dragged out, normalised so it works in any drag direction.
function draftBox(draft: ShapeDraft, shapeType: ShapeKind) {
  let width = Math.abs(draft.end.x - draft.start.x)
  let height = Math.abs(draft.end.y - draft.start.y)

  if (LINE_SHAPES.includes(shapeType)) {
    height = Math.max(height, (SHAPE_SIZES[shapeType] ?? LINE_SIZE).height)
  } else if (draft.square) {
    const side = Math.max(width, height)
    width = side
    height = side
  }

  return {
    x: draft.end.x < draft.start.x ? draft.start.x - width : draft.start.x,
    y: draft.end.y < draft.start.y ? draft.start.y - height : draft.start.y,
    width: Math.max(width, MIN_SHAPE_SIZE),
    height: Math.max(height, MIN_SHAPE_SIZE),
  }
}

function createNode(
  tool: ToolId,
  id: string,
  position: { x: number; y: number },
  noteColor: string,
  shapeType: ShapeKind,
): FlowNode {
  if (tool === 'note') {
    // Sticky notes start square; the resizer keeps them square.
    return {
      id,
      type: 'note',
      position,
      width: NOTE_SIZE,
      height: NOTE_SIZE,
      data: { label: 'Note', color: noteColor },
    }
  }

  if (tool === 'shape') {
    return {
      id,
      type: 'shape',
      position,
      ...(SHAPE_SIZES[shapeType] ?? LINE_SIZE),
      data: {
        label: '',
        shape: shapeType,
        color: SHAPE_COLORS[Math.floor(Math.random() * SHAPE_COLORS.length)],
      },
    }
  }

  return { id, type: 'text', position, data: { label: 'Text' } }
}

function BoardCursor({ connectionId }: { userId: string; connectionId: number }) {
  const info = useOther(connectionId, (other) => other.info)
  // The AI agent shows what it is doing next to its name ("AI Agent · Drawing a house…").
  const status = useOther(connectionId, (other) => other.presence.aiStatus)
  if (!info) return null
  return <Cursor color={info.color} label={status ? `${info.name} · ${status}` : info.name} />
}

type BoardCanvasProps = {
  activeTool: ToolId
  onToolChange: (tool: ToolId) => void
  onSelectTool: (tool: ToolId, shapeType?: ShapeKind) => void
  noteColor: string
  shapeType: ShapeKind
  drawMode: DrawToolMode
  drawSize: StrokeSize
  drawColor: string
  initialNodes: FlowNode[]
  initialEdges: FlowEdge[]
  focusedThreadId: string | null
  onFocusChange: (threadId: string | null) => void
  focusPan: { x: number; y: number } | null
  onFocusPanConsumed: () => void
  onSelectionChange?: (items: BoardContextItem[]) => void
  // Empty-state AI prompt (typed or a suggestion pill).
  onAskAi: (prompt: string) => void
}

export function BoardCanvas({
  activeTool,
  onToolChange,
  onSelectTool,
  noteColor,
  shapeType,
  drawMode,
  drawSize,
  drawColor,
  initialNodes,
  initialEdges,
  focusedThreadId,
  onFocusChange,
  focusPan,
  onFocusPanConsumed,
  onSelectionChange,
  onAskAi,
}: BoardCanvasProps) {
  const {
    nodes: flowNodes,
    edges: flowEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDelete,
    isLoading,
  } = useLiveblocksFlow<FlowNode, FlowEdge>({
    nodes: { initial: initialNodes },
    edges: { initial: initialEdges },
  })

  const { screenToFlowPosition, getNode, getInternalNode, setCenter, fitView } = useReactFlow()

  // Zoom to fit the board once its content has loaded (templates can be wider than
  // the screen). Only once per visit, so it never fights the user's own zooming.
  const hasFittedView = useRef(false)
  useEffect(() => {
    if (hasFittedView.current || isLoading || !flowNodes?.length) return
    hasFittedView.current = true
    requestAnimationFrame(() => void fitView({ padding: 0.12, maxZoom: 1 }))
  }, [isLoading, flowNodes, fitView])
  const status = useStatus()
  const undo = useUndo()
  const redo = useRedo()
  const canUndo = useCanUndo()
  const canRedo = useCanRedo()
  const [showGrid, setShowGrid] = useState(true)
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)

  // React Flow needs a parent (frame) before its children in the array, otherwise
  // children are positioned wrongly and jump when the order changes (e.g. on select).
  // Liveblocks doesn't keep the order, so frames always go first.
  const nodes = useMemo(() => {
    const list = flowNodes ?? []
    return [...list.filter((n) => n.type === 'frame'), ...list.filter((n) => n.type !== 'frame')]
  }, [flowNodes])
  const edges = flowEdges ?? []

  // Report the current selection (id + type + label) up to the board page, so the
  // AI panel can offer the selected objects as chat context.
  const selectedIds = useMemo(
    () => nodes.filter((n) => n.selected).map((n) => n.id).sort().join(','),
    [nodes],
  )
  useEffect(() => {
    onSelectionChange?.(
      nodes
        .filter((n) => n.selected)
        .map((n) => ({ id: n.id, type: n.type ?? '', label: n.data?.label ?? '' })),
    )
    // `onSelectionChange` is a stable setState from the board page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds])

  const setNodeLabel = (id: string, label: string) => {
    const node = getNode(id) as FlowNode | undefined
    if (!node) return
    onNodesChange([{ type: 'replace', id, item: { ...node, data: { ...node.data, label } } }])
  }

  const finishEditing = () => setEditingNodeId(null)

  // Fills an empty board with a template's nodes + edges (from the empty state).
  const applyTemplate = useCallback(
    async (key: string) => {
      try {
        const { template } = await getBoardTemplateQueryFn(key)
        if (template.nodes.length) {
          onNodesChange(template.nodes.map((node) => ({ type: 'add' as const, item: node })))
        }
        if (template.edges.length) {
          onEdgesChange(template.edges.map((edge) => ({ type: 'add' as const, item: edge })))
        }
      } catch (error) {
        console.error('Failed to load template', error)
        toast.error('Failed to load template')
      }
    },
    [onNodesChange, onEdgesChange],
  )

  const setNodeColor = (id: string, color: string) => {
    const node = getNode(id) as FlowNode | undefined
    if (!node) return
    onNodesChange([{ type: 'replace', id, item: { ...node, data: { ...node.data, color } } }])
  }

  // After a drag, attach each item to the frame its centre is over (or detach it
  // from a frame when dragged out), so frames move their items as a group.
  const handleNodeDragStop = (_event: unknown, _node: FlowNode, dragged: FlowNode[]) => {
    const frames = nodes.filter((n) => n.type === 'frame')
    const changes: NodeChange<FlowNode>[] = []

    for (const item of dragged) {
      if (item.type === 'frame') continue
      const internal = getInternalNode(item.id)
      if (!internal) continue
      const abs = internal.internals.positionAbsolute
      const width = internal.measured.width ?? item.width ?? 0
      const height = internal.measured.height ?? item.height ?? 0
      const cx = abs.x + width / 2
      const cy = abs.y + height / 2

      // Topmost (last) frame under the item's centre.
      const target = [...frames].reverse().find((frame) => {
        const f = getInternalNode(frame.id)
        if (!f) return false
        const fx = f.internals.positionAbsolute.x
        const fy = f.internals.positionAbsolute.y
        const fw = f.measured.width ?? frame.width ?? 0
        const fh = f.measured.height ?? frame.height ?? 0
        return cx >= fx && cx <= fx + fw && cy >= fy && cy <= fy + fh
      })

      const nextParent = target?.id
      if (nextParent === item.parentId) continue

      const current = getNode(item.id) as FlowNode | undefined
      if (!current) continue
      const origin = target ? getInternalNode(target.id)!.internals.positionAbsolute : { x: 0, y: 0 }
      const { parentId: _old, ...rest } = current
      changes.push({
        type: 'replace',
        id: item.id,
        item: {
          ...rest,
          ...(nextParent ? { parentId: nextParent } : {}),
          position: { x: abs.x - origin.x, y: abs.y - origin.y },
        },
      })
    }

    if (changes.length) onNodesChange(changes)
  }

  const uploadFile = useUploadFile()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const viewportCenter = useCallback(() => {
    const rect = canvasRef.current?.getBoundingClientRect()
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2
    const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2
    return screenToFlowPosition({ x, y })
  }, [screenToFlowPosition])

  // Keep uploaded files referenced in Storage so Liveblocks serves their URLs.
  const saveImageFile = useMutation(({ storage }, nodeId: string, liveFile: LiveFile) => {
    let images = storage.get('images')
    if (!images) {
      // Rooms created before image support have no `images` map yet.
      images = new LiveMap()
      storage.set('images', images)
    }
    images.set(nodeId, liveFile)
  }, [])

  const removeImageFiles = useMutation(({ storage }, nodeIds: string[]) => {
    const images = storage.get('images')
    if (!images) return
    for (const nodeId of nodeIds) images.delete(nodeId)
  }, [])

  const handleDelete = useCallback(
    (params: { nodes: FlowNode[]; edges: FlowEdge[] }) => {
      const imageIds = params.nodes.filter((n) => n.type === 'image').map((n) => n.id)
      if (imageIds.length) removeImageFiles(imageIds)
      onDelete(params)
    },
    [onDelete, removeImageFiles],
  )

  const handleImageFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const id = crypto.randomUUID()
    const node: FlowNode = {
      id,
      type: 'image',
      position: viewportCenter(),
      width: 240,
      height: 180,
      data: { label: '' },
    }

    // Add the node immediately with an "Uploading…" state, then attach the file.
    onNodesChange([{ type: 'add', item: node }])

    try {
      const liveFile = await uploadFile(file)
      saveImageFile(id, liveFile)
      const current = (getNode(id) as FlowNode | undefined) ?? node
      onNodesChange([
        { type: 'replace', id, item: { ...current, data: { ...current.data, fileId: liveFile.id } } },
      ])
    } catch (error) {
      console.error('Image upload failed', error)
      const failedNode = getNode(id) as FlowNode | undefined
      if (failedNode) onDelete({ nodes: [failedNode], edges: [] })
      toast.error('Failed to upload image')
    }
  }

  // Open the file picker when the Image tool is selected, then drop back to Select.
  useEffect(() => {
    if (activeTool !== 'image') return
    fileInputRef.current?.click()
    onSelectTool('select')
  }, [activeTool, onSelectTool])

  const duplicateSelection = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected)
    if (selectedNodes.length === 0) return

    const idMap = new Map<string, string>()
    const newNodes: FlowNode[] = selectedNodes.map((node) => {
      const newId = crypto.randomUUID()
      idMap.set(node.id, newId)
      return {
        ...node,
        id: newId,
        position: { x: node.position.x + 24, y: node.position.y + 24 },
        selected: true,
      }
    })

    const selectedIds = new Set(selectedNodes.map((n) => n.id))
    const newEdges: FlowEdge[] = edges
      .filter((e) => selectedIds.has(e.source) && selectedIds.has(e.target))
      .map((e) => ({
        ...e,
        id: crypto.randomUUID(),
        source: idMap.get(e.source) ?? e.source,
        target: idMap.get(e.target) ?? e.target,
      }))

    onNodesChange([
      ...selectedNodes.map((n) => ({ type: 'select' as const, id: n.id, selected: false })),
      ...newNodes.map((n) => ({ type: 'add' as const, item: n })),
    ])
    if (newEdges.length) {
      onEdgesChange(newEdges.map((e) => ({ type: 'add' as const, item: e })))
    }
  }, [nodes, edges, onNodesChange, onEdgesChange])

  useEffect(() => {
    const isTextTarget = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false
      return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTextTarget(event.target)) return

      const mod = event.metaKey || event.ctrlKey

      if (mod && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
        return
      }

      if (mod && event.key.toLowerCase() === 'd') {
        event.preventDefault()
        duplicateSelection()
        return
      }

      if (mod || event.altKey) return

      switch (event.key.toLowerCase()) {
        case 'v':
          onSelectTool('select')
          break
        case 'n':
          onSelectTool('note')
          break
        case 't':
          onSelectTool('text')
          break
        case 'r':
          onSelectTool('shape', 'rectangle')
          break
        case 'o':
          onSelectTool('shape', 'oval')
          break
        case 'l':
          onSelectTool('shape', 'line')
          break
        case 'h':
          onSelectTool('hand')
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onSelectTool, undo, redo, duplicateSelection])

  const [drawing, setDrawing] = useState<StrokePoint[] | null>(null)
  const drawingRef = useRef<StrokePoint[]>([])
  const pointerDown = useRef(false)

  // Position of the in-flight comment pin. Set when the user clicks the canvas
  // with the Comment tool, cleared once the FloatingComposer closes.
  const [commentDraft, setCommentDraft] = useState<CommentPosition | null>(null)

  const createPathNode = (points: StrokePoint[]) => {
    if (points.length < 2) return
    const xs = points.map((p) => p.x)
    const ys = points.map((p) => p.y)
    const minX = Math.min(...xs)
    const minY = Math.min(...ys)
    const maxX = Math.max(...xs)
    const maxY = Math.max(...ys)
    const width = Math.max(maxX - minX, 8)
    const height = Math.max(maxY - minY, 8)
    const relPoints = points.map((p) => ({ x: p.x - minX, y: p.y - minY }))

    onNodesChange([
      {
        type: 'add',
        item: {
          id: crypto.randomUUID(),
          type: 'path',
          position: { x: minX, y: minY },
          width,
          height,
          data: {
            label: '',
            points: relPoints,
            color: drawColor,
            size: drawSize,
            mode: drawMode === 'highlighter' ? 'highlighter' : 'pen',
          },
        },
      },
    ])
  }

  const eraseAt = (pos: { x: number; y: number }) => {
    const hitNode = nodes.find((n) => {
      if (n.type !== 'path') return false
      const w = n.width ?? 40
      const h = n.height ?? 40
      return (
        pos.x >= n.position.x &&
        pos.x <= n.position.x + w &&
        pos.y >= n.position.y &&
        pos.y <= n.position.y + h
      )
    })
    if (hitNode) onDelete({ nodes: [hitNode], edges: [] })
  }

  const handleDrawStart = (event: PointerEvent) => {
    if (status !== 'connected') return
    // Keep receiving moves even over the toolbar or outside the canvas.
    event.currentTarget.setPointerCapture(event.pointerId)
    pointerDown.current = true
    const pos = screenToFlowPosition({ x: event.clientX, y: event.clientY })
    if (drawMode === 'eraser') {
      eraseAt(pos)
      return
    }
    drawingRef.current = [pos]
    setDrawing([pos])
  }

  const handleDrawMove = (event: PointerEvent) => {
    if (!pointerDown.current) return
    const pos = screenToFlowPosition({ x: event.clientX, y: event.clientY })
    if (drawMode === 'eraser') {
      eraseAt(pos)
      return
    }
    drawingRef.current = [...drawingRef.current, pos]
    setDrawing(drawingRef.current)
  }

  const handleDrawEnd = () => {
    pointerDown.current = false
    if (drawMode === 'eraser') return
    if (drawingRef.current.length >= 2) createPathNode(drawingRef.current)
    drawingRef.current = []
    setDrawing(null)
  }

  // Adds a freshly created node, selects it, starts editing its text if it has any,
  // and returns to the Select tool.
  const placeNode = (node: FlowNode) => {
    onNodesChange([
      { type: 'add', item: node },
      { type: 'select', id: node.id, selected: true },
    ])
    const isEditable =
      node.type !== 'shape' || TEXT_SHAPES.includes(node.data.shape ?? 'rectangle')
    if (isEditable) setEditingNodeId(node.id)
    onToolChange('select')
  }

  const handlePaneClick = (event: MouseEvent) => {
    if (status !== 'connected') return
    if (activeTool === 'comment') {
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      setCommentDraft({ x: position.x, y: position.y })
      return
    }
    if (!ADD_TOOLS.includes(activeTool)) return
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
    placeNode(createNode(activeTool, crypto.randomUUID(), position, noteColor, shapeType))
  }

  // Drop the draft if the user switches tools or escapes before submitting.
  useEffect(() => {
    if (activeTool !== 'comment' && commentDraft) setCommentDraft(null)
  }, [activeTool, commentDraft])

  // Pan the canvas to a focused comment pin (from the header comments menu).
  useEffect(() => {
    if (!focusPan) return
    setCenter(focusPan.x, focusPan.y, { duration: 400 })
    onFocusPanConsumed()
  }, [focusPan, setCenter, onFocusPanConsumed])

  // Follow the AI agent: when it starts a new task somewhere off-screen, pan to it
  // so you see its cursor and the result (it often works below existing content).
  const agentCursor = useOthers((others) => {
    const agent = others.find((other) => other.id === 'ai-agent')
    const status = agent?.presence.aiStatus
    return agent?.presence.cursor && status && status !== 'Done'
      ? { ...agent.presence.cursor, status }
      : null
  }, shallow)
  const followedStatus = useRef<string | null>(null)
  useEffect(() => {
    if (!agentCursor) {
      followedStatus.current = null
      return
    }
    if (followedStatus.current === agentCursor.status) return
    followedStatus.current = agentCursor.status
    const bounds = document.querySelector('.react-flow')?.getBoundingClientRect()
    if (!bounds) return
    const topLeft = screenToFlowPosition({ x: bounds.left, y: bounds.top })
    const bottomRight = screenToFlowPosition({ x: bounds.right, y: bounds.bottom })
    const visible =
      agentCursor.x > topLeft.x &&
      agentCursor.x < bottomRight.x &&
      agentCursor.y > topLeft.y &&
      agentCursor.y < bottomRight.y
    if (!visible) setCenter(agentCursor.x + 150, agentCursor.y + 150, { duration: 600 })
  }, [agentCursor, screenToFlowPosition, setCenter])

  // Shape tool: click places the default size, click-and-drag draws it to size.
  const [shapeDraft, setShapeDraft] = useState<ShapeDraft | null>(null)
  const shapeDraftRef = useRef<ShapeDraft | null>(null)

  const updateShapeDraft = (draft: ShapeDraft | null) => {
    shapeDraftRef.current = draft
    setShapeDraft(draft)
  }

  const handleShapeStart = (event: PointerEvent) => {
    if (status !== 'connected' || event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    const screen = { x: event.clientX, y: event.clientY }
    const flow = screenToFlowPosition(screen)
    updateShapeDraft({
      start: flow,
      end: flow,
      startScreen: screen,
      endScreen: screen,
      square: event.shiftKey,
    })
  }

  const handleShapeMove = (event: PointerEvent) => {
    const draft = shapeDraftRef.current
    if (!draft) return
    const screen = { x: event.clientX, y: event.clientY }
    updateShapeDraft({
      ...draft,
      end: screenToFlowPosition(screen),
      endScreen: screen,
      square: event.shiftKey,
    })
  }

  const handleShapeEnd = () => {
    const draft = shapeDraftRef.current
    updateShapeDraft(null)
    if (!draft) return

    const id = crypto.randomUUID()
    if (!draftMoved(draft)) {
      placeNode(createNode('shape', id, draft.start, noteColor, shapeType))
      return
    }

    const box = draftBox(draft, shapeType)
    placeNode({
      ...createNode('shape', id, { x: box.x, y: box.y }, noteColor, shapeType),
      width: box.width,
      height: box.height,
    })
  }

  // Frame tool: drag to draw a frame; nodes whose centre lands inside it become
  // its children, so they move together when the frame moves.
  const [frameDraft, setFrameDraft] = useState<ShapeDraft | null>(null)
  const frameDraftRef = useRef<ShapeDraft | null>(null)

  const updateFrameDraft = (draft: ShapeDraft | null) => {
    frameDraftRef.current = draft
    setFrameDraft(draft)
  }

  const handleFrameStart = (event: PointerEvent) => {
    if (status !== 'connected' || event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    const screen = { x: event.clientX, y: event.clientY }
    const flow = screenToFlowPosition(screen)
    updateFrameDraft({ start: flow, end: flow, startScreen: screen, endScreen: screen, square: event.shiftKey })
  }

  const handleFrameMove = (event: PointerEvent) => {
    const draft = frameDraftRef.current
    if (!draft) return
    const screen = { x: event.clientX, y: event.clientY }
    updateFrameDraft({ ...draft, end: screenToFlowPosition(screen), endScreen: screen, square: event.shiftKey })
  }

  const handleFrameEnd = () => {
    const draft = frameDraftRef.current
    updateFrameDraft(null)
    if (!draft) return
    if (!draftMoved(draft)) {
      createFrame({ x: draft.start.x, y: draft.start.y, width: 400, height: 440 })
      return
    }
    createFrame(draftBox(draft, 'rectangle'))
  }

  const createFrame = (box: { x: number; y: number; width: number; height: number }) => {
    const frameId = crypto.randomUUID()
    const frame: FlowNode = {
      id: frameId,
      type: 'frame',
      position: { x: box.x, y: box.y },
      width: box.width,
      height: box.height,
      zIndex: -1,
      data: { label: 'Frame', color: FRAME_DEFAULT_COLOR },
    }

    const changes: NodeChange<FlowNode>[] = [{ type: 'add', item: frame }]

    for (const node of nodes) {
      if (node.id === frameId || node.type === 'frame' || node.parentId) continue
      const internal = getInternalNode(node.id)
      const w = internal?.measured.width ?? node.width ?? 0
      const h = internal?.measured.height ?? node.height ?? 0
      const cx = node.position.x + w / 2
      const cy = node.position.y + h / 2
      if (cx < box.x || cx > box.x + box.width || cy < box.y || cy > box.y + box.height) continue

      changes.push({
        type: 'replace',
        id: node.id,
        item: {
          ...node,
          parentId: frameId,
          position: { x: node.position.x - box.x, y: node.position.y - box.y },
        },
      })
    }

    onNodesChange([...changes, { type: 'select', id: frameId, selected: true }])
    onToolChange('select')
  }

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void document.documentElement.requestFullscreen()
    }
  }

  const cursor = getBoardCursor(activeTool)
  const nodeCursor = getBoardNodeCursor(activeTool)
  const previewMode = drawMode === 'highlighter' ? 'highlighter' : 'pen'
  const drawingD = drawing ? smoothPath(drawing) : ''
  const shapePreview =
    shapeDraft && draftMoved(shapeDraft) ? draftBox(shapeDraft, shapeType) : null
  const framePreview =
    frameDraft && draftMoved(frameDraft) ? draftBox(frameDraft, 'rectangle') : null

  return (
    <div
      // isolate: keeps the draw layer (z-20) from covering the toolbar outside the canvas.
      ref={canvasRef}
      className="board-canvas relative isolate h-full w-full bg-canvas"
      style={{ '--board-cursor': cursor, '--board-node-cursor': nodeCursor } as CSSProperties}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFile}
      />
      <BoardNodeContext.Provider
        value={{
          editingNodeId,
          setNodeLabel,
          setNodeColor,
          finishEditing,
          isConnecting: activeTool === 'connector',
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDelete={handleDelete}
          nodeTypes={nodeTypes}
          onPaneClick={handlePaneClick}
          onNodeClick={(event, node) => {
            // Comment tool on a node: attach the comment so its pin moves with the node.
            if (activeTool !== 'comment' || status !== 'connected') return
            const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
            const origin = getInternalNode(node.id)?.internals.positionAbsolute ?? node.position
            setCommentDraft({
              x: position.x,
              y: position.y,
              nodeId: node.id,
              offsetX: position.x - origin.x,
              offsetY: position.y - origin.y,
            })
          }}
          onNodeDoubleClick={(_, node) => setEditingNodeId(node.id)}
          onNodeDragStop={handleNodeDragStop}
          defaultEdgeOptions={{ markerEnd: { type: MarkerType.ArrowClosed } }}
          panOnDrag={activeTool === 'hand' ? [0, 1] : [1]}
          panActivationKeyCode="Space"
          // Select tool: drag on empty canvas draws a selection box; anything the box
          // touches is selected. Shift/Cmd/Ctrl-click adds to the selection.
          selectionOnDrag={activeTool === 'select'}
          selectionMode={SelectionMode.Partial}
          multiSelectionKeyCode={['Shift', 'Meta', 'Control']}
          nodesConnectable={activeTool === 'connector'}
          nodesDraggable={activeTool !== 'hand'}
          elementsSelectable={activeTool !== 'hand'}
          deleteKeyCode={['Backspace', 'Delete']}
        >
          {showGrid ? (
            <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="#DCE3ED" />
          ) : null}
          <Cursors components={{ Cursor: BoardCursor }} />
          <ViewportPortal>
            <BoardComments
              draft={commentDraft}
              onDraftConsumed={() => setCommentDraft(null)}
              focusedThreadId={focusedThreadId}
              onFocusChange={onFocusChange}
            />
            {drawing ? (
              <svg className="pointer-events-none absolute left-0 top-0 overflow-visible">
                <path
                  d={drawingD}
                  fill="none"
                  stroke={drawColor}
                  strokeWidth={strokeWidth(drawSize, previewMode)}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={strokeOpacity(previewMode)}
                />
              </svg>
            ) : null}
            {shapePreview ? (
              <div
                className={cn(
                  'pointer-events-none absolute border-2 border-dashed border-primary bg-primary/10',
                  shapeType === 'oval' ? 'rounded-[50%]' : 'rounded-md',
                )}
                style={{
                  left: shapePreview.x,
                  top: shapePreview.y,
                  width: shapePreview.width,
                  height: shapePreview.height,
                }}
              />
            ) : null}
            {framePreview ? (
              <div
                className="pointer-events-none absolute rounded-xl border-2 border-dashed border-primary/60 bg-primary/10"
                style={{
                  left: framePreview.x,
                  top: framePreview.y,
                  width: framePreview.width,
                  height: framePreview.height,
                }}
              />
            ) : null}
          </ViewportPortal>
        </ReactFlow>
      </BoardNodeContext.Provider>

      {!isLoading && nodes.length === 0 ? (
        <div
          className={cn(
            'pointer-events-none absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-200',
            activeTool !== 'select' && 'opacity-30',
          )}
        >
          <BoardEmptyState onSelectTemplate={applyTemplate} onAskAi={onAskAi} />
        </div>
      ) : null}

      {activeTool === 'draw' ? (
        <div
          className="absolute inset-0 z-20"
          style={{ cursor: drawMode === 'eraser' ? eraserCursor : getBoardCursor('draw') }}
          onPointerDown={handleDrawStart}
          onPointerMove={handleDrawMove}
          onPointerUp={handleDrawEnd}
          onPointerCancel={handleDrawEnd}
        />
      ) : null}

      {activeTool === 'shape' ? (
        <div
          className="absolute inset-0 z-20"
          style={{ cursor: getBoardCursor('shape') }}
          onPointerDown={handleShapeStart}
          onPointerMove={handleShapeMove}
          onPointerUp={handleShapeEnd}
          onPointerCancel={() => updateShapeDraft(null)}
        />
      ) : null}

      {activeTool === 'frame' ? (
        <div
          className="absolute inset-0 z-20"
          style={{ cursor: getBoardCursor('frame') }}
          onPointerDown={handleFrameStart}
          onPointerMove={handleFrameMove}
          onPointerUp={handleFrameEnd}
          onPointerCancel={() => updateFrameDraft(null)}
        />
      ) : null}

      <CanvasBottomBar
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid((current) => !current)}
        onToggleFullscreen={toggleFullscreen}
      />
    </div>
  )
}

function CanvasBottomBar({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  showGrid,
  onToggleGrid,
  onToggleFullscreen,
}: {
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  showGrid: boolean
  onToggleGrid: () => void
  onToggleFullscreen: () => void
}) {
  const { zoomIn, zoomOut, zoomTo } = useReactFlow()
  const { zoom } = useViewport()

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-center justify-between px-4 py-3 [&>*]:pointer-events-auto">
      <div className="flex items-center gap-0.5 rounded-lg border bg-background p-1 shadow-sm">
        <IconButton label="Undo" onClick={onUndo} disabled={!canUndo}>
          <Undo2Icon />
        </IconButton>
        <IconButton label="Redo" onClick={onRedo} disabled={!canRedo}>
          <Redo2Icon />
        </IconButton>
        <IconButton label="Version history">
          <HistoryIcon />
        </IconButton>
      </div>

      <div className="flex items-center gap-0.5 rounded-lg border bg-background p-1 shadow-sm">
        <IconButton label="Show grid" active={showGrid} onClick={onToggleGrid}>
          <LayoutGridIcon />
        </IconButton>
        <IconButton label="Zoom out" onClick={() => zoomOut()}>
          <MinusIcon />
        </IconButton>
        <button
          type="button"
          aria-label="Reset zoom"
          onClick={() => zoomTo(1)}
          className="min-w-12 text-center text-sm text-muted-foreground transition hover:text-foreground"
        >
          {Math.round(zoom * 100)}%
        </button>
        <IconButton label="Zoom in" onClick={() => zoomIn()}>
          <PlusIcon />
        </IconButton>
        <IconButton label="Fullscreen" onClick={onToggleFullscreen}>
          <MaximizeIcon />
        </IconButton>
      </div>
    </div>
  )
}

function IconButton({
  label,
  onClick,
  disabled,
  active,
  children,
}: {
  label: string
  onClick?: () => void
  disabled?: boolean
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex size-8 items-center justify-center rounded-md text-foreground/70 transition [&_svg]:size-4 hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40',
        active && 'bg-muted text-foreground',
      )}
    >
      {children}
    </button>
  )
}
