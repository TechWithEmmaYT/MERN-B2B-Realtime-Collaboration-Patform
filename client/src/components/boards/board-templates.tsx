import { PlusIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export type BoardTemplateId = 'blank' | 'brainstorm' | 'flowchart' | 'roadmap' | 'journey' | 'launch'

export type BoardTemplate = {
  id: BoardTemplateId
  name: string
  description: string
  illustration: ReactNode
}

export const boardTemplates: BoardTemplate[] = [
  {
    id: 'blank',
    name: 'Blank board',
    description: 'Start from an empty canvas',
    illustration: <PlusIcon className="size-8 text-foreground" strokeWidth={1.5} />,
  },
  {
    id: 'brainstorm',
    name: 'Brainstorming',
    description: 'Sticky notes to collect ideas',
    illustration: <BrainstormIllustration />,
  },
  {
    id: 'flowchart',
    name: 'Flowchart',
    description: 'Map a process step by step',
    illustration: <FlowchartIllustration />,
  },
  {
    id: 'roadmap',
    name: 'Product roadmap',
    description: 'Plan milestones by quarter',
    illustration: <RoadmapIllustration />,
  },
  {
    id: 'journey',
    name: 'User journey map',
    description: 'Follow a user through each stage',
    illustration: <JourneyIllustration />,
  },
  {
    id: 'launch',
    name: 'Product launch',
    description: 'Ideas, flow, roadmap and goals in one board',
    illustration: <LaunchIllustration />,
  },
]

export const getBoardTemplate = (id: BoardTemplateId) =>
  boardTemplates.find((template) => template.id === id) ?? boardTemplates[0]!

function BrainstormIllustration() {
  return (
    <svg viewBox="0 0 120 80" className="h-full w-auto">
      <rect x="18" y="12" width="26" height="24" rx="2" fill="#FDE68A" />
      <rect x="58" y="4" width="24" height="22" rx="2" fill="#FDE68A" />
      <rect x="22" y="42" width="26" height="24" rx="2" fill="#F9A8D4" />
      <rect x="76" y="30" width="26" height="24" rx="2" fill="#93C5FD" />
      <rect x="58" y="56" width="26" height="20" rx="2" fill="#FDE68A" />
      <path d="M70 26 V36 H76" stroke="#71717A" strokeWidth={1} fill="none" />
    </svg>
  )
}

function FlowchartIllustration() {
  return (
    <svg viewBox="0 0 120 80" className="h-full w-auto">
      <rect x="8" y="8" width="26" height="20" rx="3" fill="#A78BFA" />
      <rect x="10" y="17" width="6" height="2" fill="#fff" />
      <rect x="8" y="48" width="36" height="20" rx="3" fill="#60A5FA" />
      <rect x="20" y="57" width="12" height="2" fill="#fff" />
      <path d="M86 4 L104 18 L86 32 L68 18 Z" fill="#FACC15" />
      <rect x="72" y="46" width="28" height="24" rx="2" fill="#34D399" />
      <path
        d="M34 18 H68 M52 18 V58 H44 M86 32 V46"
        stroke="#71717A"
        strokeWidth={1}
        fill="none"
      />
    </svg>
  )
}

function RoadmapIllustration() {
  const colors = [
    ['#DBEAFE', '#60A5FA'],
    ['#FCE7F3', '#F472B6'],
    ['#D1FAE5', '#34D399'],
  ]
  return (
    <svg viewBox="0 0 120 80" className="h-full w-auto">
      {colors.map(([bg, fg], i) => (
        <g key={fg} transform={`translate(${4 + i * 40}, 0)`}>
          <rect width="32" height="80" rx="3" fill={bg} />
          <rect x="4" y="6" width="24" height="10" rx="2" fill={fg} />
          {[24, 36, 48, 60].map((y) => (
            <rect
              key={y}
              x="4"
              y={y}
              width="24"
              height="4"
              rx="2"
              fill={fg}
              opacity={0.8}
            />
          ))}
        </g>
      ))}
    </svg>
  )
}

function LaunchIllustration() {
  return (
    <svg viewBox="0 0 120 80" className="h-full w-auto">
      {/* Brainstorm frame with notes, and a hand-drawn circle */}
      <rect x="2" y="4" width="44" height="34" rx="3" fill="#FEF9C3" />
      <rect x="7" y="10" width="10" height="10" rx="1" fill="#FDE68A" />
      <rect x="20" y="10" width="10" height="10" rx="1" fill="#F9A8D4" />
      <rect x="33" y="10" width="10" height="10" rx="1" fill="#93C5FD" />
      <rect x="7" y="23" width="10" height="10" rx="1" fill="#86EFAC" />
      <rect x="20" y="23" width="10" height="10" rx="1" fill="#C4B5FD" />
      <ellipse cx="25" cy="15" rx="8" ry="7.5" stroke="#EF4444" strokeWidth={1} fill="none" />
      {/* User flow */}
      <rect x="52" y="4" width="66" height="34" rx="3" fill="#F4F4F5" />
      <ellipse cx="62" cy="21" rx="6" ry="4" fill="#93C5FD" />
      <path d="M84 14 L90 21 L84 28 L78 21 Z" fill="#FDE047" />
      <rect x="98" y="10" width="14" height="7" rx="1.5" fill="#B8A4FF" />
      <rect x="98" y="25" width="14" height="7" rx="1.5" fill="#FFA94D" />
      <path d="M68 21 H78 M90 21 H94 V13.5 H98 M94 21 V28.5 H98" stroke="#71717A" strokeWidth={0.8} fill="none" />
      {/* Roadmap */}
      <rect x="2" y="44" width="72" height="32" rx="3" fill="#DBEAFE" />
      <rect x="6" y="48" width="18" height="6" rx="1.5" fill="#B8A4FF" />
      <rect x="29" y="48" width="18" height="6" rx="1.5" fill="#F9A8D4" />
      <rect x="52" y="48" width="18" height="6" rx="1.5" fill="#86EFAC" />
      {[6, 29, 52].map((x) => (
        <rect key={x} x={x} y="58" width="9" height="9" rx="1" fill="#FFF59D" />
      ))}
      {/* Goals with a rocket doodle */}
      <rect x="80" y="44" width="38" height="32" rx="3" fill="#F4F4F5" />
      <path d="M86 70 L92 52 L98 70 Z" fill="#FFA94D" />
      <path d="M108 50 C112 55 112 62 111 68 H105 C104 62 104 55 108 50 Z" stroke="#1F1F1F" strokeWidth={0.9} fill="none" />
      <path d="M106 70 L108 74 L110 70" stroke="#F97316" strokeWidth={1} fill="none" />
    </svg>
  )
}

function JourneyIllustration() {
  const steps = [
    ['#FACC15', '#FEF3C7'],
    ['#60A5FA', '#DBEAFE'],
    ['#A78BFA', '#EDE9FE'],
  ]
  return (
    <svg viewBox="0 0 120 80" className="h-full w-auto">
      <path d="M16 16 H104" stroke="#71717A" strokeWidth={1} />
      {steps.map(([fg, bg], i) => (
        <g key={fg} transform={`translate(${i * 44}, 0)`}>
          <circle cx="16" cy="16" r="8" fill={fg} />
          <rect x="0" y="36" width="32" height="36" rx="2" fill={bg} />
          {[44, 52, 60].map((y) => (
            <rect
              key={y}
              x="5"
              y={y}
              width={y === 60 ? 14 : 22}
              height="3"
              rx="1.5"
              fill={fg}
            />
          ))}
        </g>
      ))}
    </svg>
  )
}
