import type { Edge, Node } from '@xyflow/react'

export type ShapeKind =
  | 'line'
  | 'arrow'
  | 'elbow-arrow'
  | 'block-arrow'
  | 'rectangle'
  | 'oval'
  | 'rhombus'
  | 'triangle'
  | 'divider'
  | 'diagram'

export type FlowNodeData = {
  label: string
  color?: string
  shape?: ShapeKind
  points?: StrokePoint[]
  size?: StrokeSize
  mode?: StrokeMode
  // Id of the LiveFile saved in Storage `images` (keyed by node id).
  fileId?: string
}

export type FlowNode = Node<FlowNodeData, 'note' | 'text' | 'shape' | 'path' | 'image' | 'frame'>

export type FlowEdge = Edge

// A canvas object the user selected, shared with the AI panel as chat context.
export type BoardContextItem = {
  id: string
  type: string
  label: string
}

export type ToolId =
  | 'select'
  | 'hand'
  | 'note'
  | 'text'
  | 'shape'
  | 'connector'
  | 'draw'
  | 'image'
  | 'frame'
  | 'comment'

export const NOTE_COLORS = [
  '#FFF59D', // light yellow
  '#FFE45C', // yellow
  '#FFB067', // orange
  '#FF8F87', // coral
  '#FFCCF0', // light pink
  '#FF94E6', // pink
  '#B3CEFF', // light blue
  '#BBA8FF', // lavender
  '#8FE3FF', // sky
  '#7AAAFF', // blue
  '#83E3D6', // teal
  '#63D884', // green
  '#D2EFA1', // light lime
  '#ADE05F', // lime
  '#F1F2F5', // light gray
  '#1F1F1F', // black
]

export const SHAPE_COLORS = ['#93C5FD', '#86EFAC', '#F9A8D4', '#C4B5FD', '#FDE68A']

export type ShapeMenuItem = {
  type: ShapeKind
  label: string
  shortcut?: string
}

export type ShapeMenuGroup = {
  label: string
  items: ShapeMenuItem[]
}

export const SHAPE_MENU: ShapeMenuGroup[] = [
  {
    label: 'Connectors',
    items: [
      { type: 'line', label: 'Line', shortcut: 'L' },
      { type: 'arrow', label: 'Arrow' },
      { type: 'elbow-arrow', label: 'Elbow arrow' },
      { type: 'block-arrow', label: 'Block arrow' },
    ],
  },
  {
    label: 'Shapes',
    items: [
      { type: 'rectangle', label: 'Rectangle', shortcut: 'R' },
      { type: 'oval', label: 'Oval', shortcut: 'O' },
      { type: 'rhombus', label: 'Rhombus' },
      { type: 'triangle', label: 'Triangle' },
      { type: 'divider', label: 'Divider' },
    ],
  },
  {
    label: '',
    items: [{ type: 'diagram', label: 'Diagram' }],
  },
]

export const TEXT_SHAPES: ShapeKind[] = ['rectangle', 'oval', 'rhombus', 'triangle']

export type DrawToolMode = 'pen' | 'highlighter' | 'eraser'

export type StrokeMode = 'pen' | 'highlighter'

export type StrokeSize = 'thin' | 'medium' | 'thick'

export type StrokePoint = { x: number; y: number }

export const DRAW_COLORS = [
  '#1F1F1F', // black
  '#EF4444', // red
  '#F97316', // orange
  '#FFD21F', // yellow
  '#10B981', // green
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
]

export const STROKE_SIZES: { id: StrokeSize; label: string }[] = [
  { id: 'thin', label: 'Thin' },
  { id: 'medium', label: 'Medium' },
  { id: 'thick', label: 'Thick' },
]

export const DRAW_MODES: { id: DrawToolMode; label: string }[] = [
  { id: 'pen', label: 'Pen' },
  { id: 'highlighter', label: 'Highlighter' },
  { id: 'eraser', label: 'Eraser' },
]
