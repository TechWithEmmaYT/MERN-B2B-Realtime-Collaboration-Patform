import commentSvg from '@/assets/icons/comment.svg?raw'
import cursorSvg from '@/assets/icons/cursor.svg?raw'
import diagramSvg from '@/assets/icons/diagram.svg?raw'
import frameSvg from '@/assets/icons/frame.svg?raw'
import imageSvg from '@/assets/icons/image.svg?raw'
import penSvg from '@/assets/icons/pen.svg?raw'
import shapesSvg from '@/assets/icons/shapes.svg?raw'
import stickyNoteSvg from '@/assets/icons/sticky-note-ai.svg?raw'
import textSvg from '@/assets/icons/text.svg?raw'
import type { ToolId } from '@/types/flow'

const toCursor = (svg: string, hotspot = '12 12') =>
  `url("data:image/svg+xml;utf8,${encodeURIComponent(
    svg
      .replace(/currentColor/g, '#111111')
      .replace(/stroke-width="1\.8"/g, 'stroke-width="2.2"')
      .replace('<svg', '<svg width="28" height="28"'),
  )}") ${hotspot}, crosshair`

const selectCursor = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  cursorSvg
    .replace('fill="none"', 'fill="#111111"')
    .replace(/currentColor/g, '#111111')
    .replace('<svg', '<svg width="26" height="26"'),
)}") 5 3, default`

const toolSvg: Record<Exclude<ToolId, 'select' | 'hand'>, string> = {
  note: stickyNoteSvg,
  text: textSvg,
  shape: shapesSvg,
  connector: diagramSvg,
  draw: penSvg,
  image: imageSvg,
  frame: frameSvg,
  comment: commentSvg,
}

export const getBoardCursor = (tool: ToolId): string => {
  if (tool === 'select') return selectCursor
  // Hand tool: native open-hand grab cursor while ready to pan.
  if (tool === 'hand') return 'grab'
  // Placing a shape: a plain plus shows exactly where it will land.
  if (tool === 'shape') return 'crosshair'
  // The pen draws from its tip (bottom-left of pen.svg), not the icon centre.
  if (tool === 'draw') return toCursor(penSvg, '5 23')
  return toCursor(toolSvg[tool])
}

// Eraser (lucide 'eraser' shape); the hotspot is the rubber end that touches the stroke.
const eraserSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FFFFFF" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>'

export const eraserCursor = toCursor(eraserSvg, '6 21')

export const getBoardNodeCursor = (tool: ToolId): string =>
  tool === 'select' ? 'pointer' : getBoardCursor(tool)
