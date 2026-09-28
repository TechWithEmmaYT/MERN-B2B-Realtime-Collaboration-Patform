import {
  ArrowUpRightIcon,
  LayoutDashboardIcon,
  MapIcon,
  MessageCircleMoreIcon,
  ShapesIcon,
} from 'lucide-react'
import type { ComponentType } from 'react'

import type { BoardTemplateId } from '@/components/boards/board-templates'

export type BoardIconInfo = {
  icon: ComponentType<{ className?: string }>
  iconClass: string
}

// Maps a board's `iconKey` (which doubles as a template id) to its icon + colour.
const templateIcons: Record<BoardTemplateId, BoardIconInfo> = {
  blank: { icon: LayoutDashboardIcon, iconClass: 'bg-muted text-foreground' },
  brainstorm: {
    icon: MessageCircleMoreIcon,
    iconClass: 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400',
  },
  flowchart: {
    icon: ShapesIcon,
    iconClass: 'bg-amber-50 text-amber-500 dark:bg-amber-500/15',
  },
  roadmap: {
    icon: ArrowUpRightIcon,
    iconClass: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
  },
  journey: {
    icon: MapIcon,
    iconClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  },
}

export const getBoardIcon = (iconKey: string): BoardIconInfo =>
  templateIcons[iconKey as BoardTemplateId] ?? templateIcons.blank
