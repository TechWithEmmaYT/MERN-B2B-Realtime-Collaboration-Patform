import {
  useCreateFeed,
  useCreateFeedMessage,
  useDeleteFeedMessage,
  useFeedMessages,
  useFeeds,
  useOthers,
  useSelf,
  useUpdateMyPresence,
} from '@liveblocks/react'
import {
  CopyIcon,
  FileTextIcon,
  HistoryIcon,
  LightbulbIcon,
  ListIcon,
  MessageSquarePlusIcon,
  MoreHorizontalIcon,
  MousePointerClickIcon,
  RefreshCcwIcon,
  SparklesIcon,
  WorkflowIcon,
  XIcon,
} from 'lucide-react'
import { nanoid } from 'nanoid'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message'
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputTextarea,
  PromptInputSubmit,
} from '@/components/ai-elements/prompt-input'
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning'
import { Shimmer } from '@/components/ai-elements/shimmer'
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion'
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from '@/components/ai-elements/tool'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ResolvedUserAvatar, useResolvedUserName } from '@/components/board/user-avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuth } from '@/context/auth-context'
import { aiChatMutationFn, stopAiChatMutationFn } from '@/lib/api'
import { cn } from '@/lib/utils'


type FeedMessageData = Liveblocks['FeedMessageData']

const QUICK_ACTIONS = [
  { id: 'brainstorm', label: 'Brainstorm ideas', icon: LightbulbIcon, prompt: 'Brainstorm ideas for this board' },
  { id: 'flowchart', label: 'Create a flowchart', icon: WorkflowIcon, prompt: 'Create a flowchart for this board' },
  { id: 'roadmap', label: 'Plan a roadmap', icon: ListIcon, prompt: 'Plan a roadmap for this board' },
  { id: 'summarize', label: 'Summarize selected objects', icon: FileTextIcon, prompt: 'Summarize the selected objects on this board' },
] as const

const TOOL_TITLES: Record<string, string> = {
  createStickyNotes: 'Add sticky notes',
  createFlowchart: 'Create flowchart',
  createRoadmap: 'Create roadmap',
  summarizeSelection: 'Summarize board',
  organizeLayout: 'Tidy layout',
}

export function AiAgentPanel({ boardId, onClose }: { boardId: string; onClose: () => void }) {
  const { user } = useAuth()
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'there'

  return (
    <aside className="flex w-96 shrink-0 flex-col border-l bg-background">
      <Chat boardId={boardId} firstName={firstName} onClose={onClose} />
    </aside>
  )
}

function Chat({
  boardId,
  firstName,
  onClose,
}: {
  boardId: string
  firstName: string
  onClose: () => void
}) {
  const { feeds } = useFeeds()
  const chats = useMemo(
    () => [...(feeds ?? [])].sort((a, b) => b.createdAt - a.createdAt),
    [feeds],
  )
  // Each time the panel opens it starts a new chat; earlier chats are in History.
  const [feedId, setFeedId] = useState(() => nanoid())

  const chatOptions = chats.map((chat) => ({
    feedId: chat.feedId,
    title: chat.metadata?.title || 'Untitled chat',
  }))

  const newChat = useCallback(() => setFeedId(nanoid()), [])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PanelHeader
        onClose={onClose}
        onNewChat={newChat}
        chats={chatOptions}
        feedId={feedId}
        onSelectChat={setFeedId}
      />
      <ChatWindow key={feedId} boardId={boardId} feedId={feedId} firstName={firstName} />
    </div>
  )
}

function ChatWindow({
  boardId,
  feedId,
  firstName,
}: {
  boardId: string
  feedId: string
  firstName: string
}) {
  const { messages } = useFeedMessages(feedId)
  const createFeed = useCreateFeed()
  const createFeedMessage = useCreateFeedMessage()
  const deleteFeedMessage = useDeleteFeedMessage()
  const { user } = useAuth()
  const self = useSelf()
  const updateMyPresence = useUpdateMyPresence()

  // Always in time order (the feed doesn't guarantee it).
  const list = useMemo(
    () => [...(messages ?? [])].sort((a, b) => a.createdAt - b.createdAt),
    [messages],
  )

  // Instant feedback: the moment you send, show your message and a "Thinking…"
  // bubble locally, until the real messages arrive through the feed.
  // `pending.after` is the id of the last message when you sent (null = empty chat);
  // `text` is empty when regenerating (no new user message).
  const [pending, setPending] = useState<{ after: string | null; text: string } | null>(null)
  const afterIndex = pending
    ? pending.after === null
      ? -1
      : list.findIndex((message) => message.id === pending.after)
    : -1
  const newMessages = pending ? list.slice(afterIndex + 1) : []
  const showPendingUser =
    !!pending && !!pending.text && !newMessages.some((m) => m.data.role === 'user')
  const waitingForReply = !!pending && !newMessages.some((m) => m.data.role === 'assistant')

  // Shared "Thinking…": others in this chat see it too, through presence.
  const othersPrompting = useOthers((others) =>
    others.some((other) => other.presence.promptingFeedId === feedId),
  )
  const lastMessage = list.at(-1)
  const othersThinking = othersPrompting && lastMessage?.data.role !== 'assistant'
  const showThinking = waitingForReply || othersThinking

  // Tell everyone we're waiting on the AI, until its reply starts.
  const selfPrompting = self?.presence.promptingFeedId === feedId
  useEffect(() => {
    if (waitingForReply && !selfPrompting) updateMyPresence({ promptingFeedId: feedId })
    if (!waitingForReply && selfPrompting) updateMyPresence({ promptingFeedId: null })
  }, [waitingForReply, selfPrompting, feedId, updateMyPresence])
  useEffect(() => () => updateMyPresence({ promptingFeedId: null }), [updateMyPresence])

  const ensuredFeeds = useRef(new Set(list.length > 0 ? [feedId] : []))
  const ensureFeed = useCallback(
    async (id: string, title: string) => {
      if (ensuredFeeds.current.has(id)) return
      ensuredFeeds.current.add(id)
      try {
        await createFeed(id, { metadata: { title } })
      } catch {
        // Feed already exists (maybe created by someone else).
      }
    },
    [createFeed],
  )

  const lastAssistant = [...list].reverse().find((message) => message.data.role === 'assistant')
  const isStreaming = showThinking || !!lastAssistant?.data.streaming

  // Blocks double sends (e.g. fast clicks on a quick action or suggestion).
  const inFlight = useRef(false)

  const requestReply = useCallback(
    (history: { role: 'user' | 'assistant'; content: string }[]) => {
      aiChatMutationFn({ boardId, feedId, messages: history })
        .catch((error: { message?: string }) => {
          setPending(null)
          toast.error(error.message ?? 'The AI agent could not reply. Try again.')
        })
        .finally(() => {
          inFlight.current = false
        })
    },
    [boardId, feedId],
  )

  const send = useCallback(
    async (text: string) => {
      const content = text.trim()
      if (!content || inFlight.current || isStreaming) return
      inFlight.current = true

      setPending({ after: list.at(-1)?.id ?? null, text: content })

      try {
        // New chats are titled after their first message (shown in History).
        await ensureFeed(feedId, content.slice(0, 60))
        await createFeedMessage(feedId, {
          role: 'user',
          content,
          userId: user?.id ?? '',
          name: user?.name ?? 'You',
          avatar: user?.avatarUrl ?? '',
        })
      } catch {
        setPending(null)
        inFlight.current = false
        toast.error('Could not send your message. Try again.')
        return
      }

      requestReply([
        ...list.map((message) => ({ role: message.data.role, content: message.data.content })),
        { role: 'user' as const, content },
      ])
    },
    [ensureFeed, createFeedMessage, user, list, feedId, isStreaming, requestReply],
  )

  // Regenerate: drop this reply and ask again with the conversation before it.
  const regenerate = useCallback(
    async (messageId: string) => {
      const index = list.findIndex((message) => message.id === messageId)
      if (index === -1 || inFlight.current || isStreaming) return
      inFlight.current = true

      setPending({ after: list[index - 1]?.id ?? null, text: '' })
      try {
        await deleteFeedMessage(feedId, messageId)
      } catch {
        setPending(null)
        inFlight.current = false
        toast.error('Could not regenerate. Try again.')
        return
      }

      requestReply(
        list
          .slice(0, index)
          .map((message) => ({ role: message.data.role, content: message.data.content })),
      )
    },
    [list, feedId, isStreaming, deleteFeedMessage, requestReply],
  )

  const stop = useCallback(() => {
    setPending(null)
    void stopAiChatMutationFn({ boardId, feedId }).catch(() => {})
  }, [boardId, feedId])

  // Follow-up suggestions from the latest finished reply.
  const followUps =
    !isStreaming && lastMessage?.data.role === 'assistant' ? (lastMessage.data.suggestions ?? []) : []

  return (
    <>
      <Conversation>
        <ConversationContent>
          {list.length === 0 && !pending && !othersThinking ? (
            <>
              <Greeting name={firstName} />
              <QuickActions onSelect={send} />
            </>
          ) : (
            <>
              {list.map((message) => (
                <FeedMessage
                  key={message.id}
                  data={message.data}
                  canRegenerate={message.id === lastAssistant?.id && !isStreaming}
                  onRegenerate={() => regenerate(message.id)}
                />
              ))}
              {showPendingUser ? (
                <FeedMessage data={{ role: 'user', content: pending.text }} />
              ) : null}
              {showThinking ? (
                <FeedMessage data={{ role: 'assistant', content: '', streaming: true }} />
              ) : null}
              {followUps.length > 0 ? (
                <Suggestions className="px-1">
                  {followUps.map((suggestion) => (
                    <Suggestion key={suggestion} suggestion={suggestion} onClick={send} />
                  ))}
                </Suggestions>
              ) : null}
            </>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="flex flex-col gap-2 border-t p-3">
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg bg-muted/70 px-3 py-2 text-left text-xs text-muted-foreground transition hover:bg-muted"
        >
          <MousePointerClickIcon className="size-4 shrink-0" />
          Select objects on the canvas to add context
        </button>

        <PromptInput onSubmit={(message) => send(message.text)}>
          <PromptInputBody>
            <PromptInputTextarea placeholder="What are you working on?" />
          </PromptInputBody>
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={isStreaming ? 'streaming' : undefined} onStop={stop} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </>
  )
}

// Clipboard API first; if the browser refuses (page not focused, permissions),
// fall back to a hidden textarea + execCommand('copy'), which still works there.
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      return document.execCommand('copy')
    } catch {
      return false
    } finally {
      textarea.remove()
    }
  }
}

function FeedMessage({
  data,
  canRegenerate,
  onRegenerate,
}: {
  data: FeedMessageData
  canRegenerate?: boolean
  onRegenerate?: () => void
}) {
  const isAssistant = data.role === 'assistant'
  // Same avatar/name/colour as the board header, looked up by user id
  // (the AI agent resolves as "AI Agent" too).
  const authorId = data.userId ?? (isAssistant ? 'ai-agent' : undefined)
  const name = useResolvedUserName(authorId, data.name ?? (isAssistant ? 'AI Agent' : 'You'))
  const finished = isAssistant && !data.streaming && !!data.content

  const copy = () => {
    void copyText(data.content).then((ok) =>
      ok ? toast.success('Copied') : toast.error('Could not copy'),
    )
  }

  return (
    <Message from={data.role}>
      <div className={cn('flex items-center gap-1.5 px-1', !isAssistant && 'flex-row-reverse')}>
        <ResolvedUserAvatar
          userId={authorId ?? ''}
          fallbackName={name}
          fallbackAvatar={data.avatar}
          className="size-6 [&_[data-slot=avatar-fallback]]:text-[10px]"
        />
        <span className="text-xs font-medium text-muted-foreground">{name}</span>
      </div>

      {isAssistant && data.tools?.length ? (
        <div className="flex flex-col gap-2 px-1">
          {data.tools.map((step) => (
            <BoardTool key={step.toolCallId} step={step} />
          ))}
        </div>
      ) : null}

      <MessageContent>
        {isAssistant && data.reasoning ? (
          <Reasoning isStreaming={!!data.streaming} defaultOpen={!!data.streaming}>
            <ReasoningTrigger />
            <ReasoningContent>{data.reasoning}</ReasoningContent>
          </Reasoning>
        ) : null}

        {data.content ? (
          <MessageResponse>{data.content}</MessageResponse>
        ) : isAssistant && data.streaming ? (
          <Shimmer>Thinking…</Shimmer>
        ) : null}
      </MessageContent>

      {finished ? (
        <MessageActions className="px-1">
          <MessageAction tooltip="Copy" label="Copy" onClick={copy}>
            <CopyIcon className="size-3.5" />
          </MessageAction>
          {canRegenerate ? (
            <MessageAction tooltip="Regenerate" label="Regenerate" onClick={onRegenerate}>
              <RefreshCcwIcon className="size-3.5" />
            </MessageAction>
          ) : null}
        </MessageActions>
      ) : null}
    </Message>
  )
}

function BoardTool({ step }: { step: NonNullable<FeedMessageData['tools']>[number] }) {
  return (
    <Tool defaultOpen={step.state !== 'input-available'}>
      <ToolHeader
        title={TOOL_TITLES[step.toolName] ?? step.toolName}
        type={step.type as never}
        state={step.state as never}
      />
      <ToolContent>
        {step.input !== undefined ? <ToolInput input={step.input as never} /> : null}
        <ToolOutput output={step.output as never} errorText={step.errorText as never} />
      </ToolContent>
    </Tool>
  )
}

type PanelHeaderProps = {
  onClose: () => void
  onNewChat: () => void
  chats: { feedId: string; title: string }[]
  feedId: string
  onSelectChat: (feedId: string) => void
}

function PanelHeader(props: PanelHeaderProps) {
  // While the AI agent works on the board, show its live status here.
  const agentStatus = useOthers((others) => {
    const agent = others.find((other) => other.id === 'ai-agent')
    const status = agent?.presence.aiStatus
    return status && status !== 'Done' ? status : null
  })
  return <PanelHeaderView {...props} agentStatus={agentStatus} />
}

function PanelHeaderView({
  onClose,
  onNewChat,
  chats,
  feedId,
  onSelectChat,
  agentStatus,
}: PanelHeaderProps & { agentStatus: string | null }) {
  return (
    <header className="flex items-start justify-between gap-2 border-b px-4 py-3">
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
          <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <SparklesIcon className="size-3.5" />
          </span>
          AI Agent
        </h2>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className={cn(
              'size-2 rounded-full bg-emerald-500',
              agentStatus && 'animate-pulse bg-primary',
            )}
          />
          {agentStatus ?? 'Online · Member of this workspace'}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <HeaderIconButton label="New chat" onClick={onNewChat}>
          <MessageSquarePlusIcon />
        </HeaderIconButton>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="History"
              className="flex size-8 items-center justify-center rounded-lg text-foreground/70 transition [&_svg]:size-4 hover:bg-muted hover:text-foreground"
            >
              <HistoryIcon />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {chats.length === 0 ? (
              <DropdownMenuItem disabled>No chats yet</DropdownMenuItem>
            ) : (
              chats.map((chat) => (
                <DropdownMenuItem
                  key={chat.feedId}
                  onSelect={() => onSelectChat(chat.feedId)}
                  className={cn(chat.feedId === feedId && 'bg-accent')}
                >
                  <span className="truncate">{chat.title}</span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <HeaderIconButton label="More options">
          <MoreHorizontalIcon />
        </HeaderIconButton>
        <HeaderIconButton label="Close" onClick={onClose}>
          <XIcon />
        </HeaderIconButton>
      </div>
    </header>
  )
}

function HeaderIconButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick?: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={onClick}
          className="flex size-8 items-center justify-center rounded-lg text-foreground/70 transition [&_svg]:size-4 hover:bg-muted hover:text-foreground"
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  )
}

function Greeting({ name }: { name: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="text-xl font-semibold tracking-tight">Hey {name}</h3>
      <p className="text-sm text-muted-foreground">
        I&apos;m here to collaborate, brainstorm, organize ideas, and create content
        directly on your board.
      </p>
    </div>
  )
}

function QuickActions({ onSelect }: { onSelect: (prompt: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={() => onSelect(action.prompt)}
          className="flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition hover:bg-muted"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
            <action.icon className="size-4" />
          </span>
          {action.label}
        </button>
      ))}
    </div>
  )
}
