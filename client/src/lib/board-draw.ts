import type { StrokeMode, StrokePoint, StrokeSize } from '@/types/flow'

// Smooth SVG path through the points: each point becomes a quadratic control point
// and the curve passes through the midpoints between them, so strokes aren't jagged.
export const smoothPath = (points: StrokePoint[]): string => {
  if (points.length === 0) return ''
  if (points.length < 3) {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  }
  let d = `M ${points[0]!.x} ${points[0]!.y}`
  for (let i = 1; i < points.length - 1; i++) {
    const current = points[i]!
    const next = points[i + 1]!
    d += ` Q ${current.x} ${current.y} ${(current.x + next.x) / 2} ${(current.y + next.y) / 2}`
  }
  const last = points[points.length - 1]!
  return `${d} L ${last.x} ${last.y}`
}

const BASE_WIDTHS: Record<StrokeSize, number> = {
  thin: 2,
  medium: 4,
  thick: 8,
}

export const strokeWidth = (size: StrokeSize, mode: StrokeMode): number => {
  const base = BASE_WIDTHS[size]
  return mode === 'highlighter' ? base * 3 : base
}

export const strokeOpacity = (mode: StrokeMode): number =>
  mode === 'highlighter' ? 0.4 : 1
