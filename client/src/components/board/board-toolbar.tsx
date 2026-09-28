import type { ComponentType, SVGProps } from 'react'

import AiSparklesIcon from '@/assets/icons/ai-sparkles.svg?react'
import CommentIcon from '@/assets/icons/comment.svg?react'
import CursorIcon from '@/assets/icons/cursor.svg?react'
import DiagramIcon from '@/assets/icons/diagram.svg?react'
import FrameIcon from '@/assets/icons/frame.svg?react'
import HandIcon from '@/assets/icons/hand.svg?react'
import ImageIcon from '@/assets/icons/image.svg?react'
import MoreIcon from '@/assets/icons/more.svg?react'
import PenIcon from '@/assets/icons/pen.svg?react'
import ShapesIcon from '@/assets/icons/shapes.svg?react'
import StickyNoteIcon from '@/assets/icons/sticky-note-ai.svg?react'
import TextIcon from '@/assets/icons/text.svg?react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { ToolId } from '@/types/flow'

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

type Tool = {
  id: ToolId
  label: string
  icon: IconComponent
}

const tools: Tool[] = [
  { id: 'select', label: 'Select', icon: CursorIcon },
  { id: 'hand', label: 'Hand', icon: HandIcon },
  { id: 'note', label: 'Note', icon: StickyNoteIcon },
  { id: 'text', label: 'Text', icon: TextIcon },
  { id: 'shape', label: 'Shape', icon: ShapesIcon },
  { id: 'connector', label: 'Connector', icon: DiagramIcon },
  { id: 'draw', label: 'Draw', icon: PenIcon },
  { id: 'image', label: 'Image', icon: ImageIcon },
  { id: 'frame', label: 'Frame', icon: FrameIcon },
  { id: 'comment', label: 'Comment', icon: CommentIcon },
]

type BoardToolbarProps = {
  activeTool: ToolId
  onToolChange: (tool: ToolId) => void
  aiAgentOpen: boolean
  onToggleAiAgent: () => void
}

export function BoardToolbar({
  activeTool,
  onToolChange,
  aiAgentOpen,
  onToggleAiAgent,
}: BoardToolbarProps) {
  return (
    <aside className="absolute left-3 top-3 z-10 flex w-14 flex-col items-center gap-0.5 rounded-xl border bg-background p-2 shadow-sm">
      <ToolButton label="AI Agent" highlighted active={aiAgentOpen} onClick={onToggleAiAgent}>
        <AiSparklesIcon />
      </ToolButton>

      <span className="my-1 h-px w-6 bg-border" />

      {tools.map((tool) => (
        <ToolButton
          key={tool.id}
          label={tool.label}
          active={activeTool === tool.id}
          onClick={() => onToolChange(tool.id)}
        >
          <tool.icon />
        </ToolButton>
      ))}

      <span className="my-1 h-px w-6 bg-border" />

      <ToolButton label="More tools">
        <MoreIcon />
      </ToolButton>
    </aside>
  )
}

type ToolButtonProps = {
  label: string
  active?: boolean
  highlighted?: boolean
  onClick?: () => void
  children: React.ReactNode
}

function ToolButton({ label, active, highlighted, onClick, children }: ToolButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={onClick}
          className={cn(
            'flex size-8.5 items-center justify-center rounded-lg text-foreground/70 transition [&_svg]:size-5 hover:bg-muted hover:text-foreground',
            highlighted && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
            active && !highlighted && 'bg-muted text-foreground',
            active && highlighted && 'ring-2 ring-primary ring-offset-1',
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}
