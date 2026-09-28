import type { Json, LiveFile, LiveMap } from '@liveblocks/client'

declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null
      // AI chat (feed) this user is waiting on, so everyone in that chat sees "Thinking…".
      promptingFeedId: string | null
      // What the AI agent is doing right now ("Drawing a house…"). Only the agent sets it.
      aiStatus?: string | null
    }
    // Uploaded images, keyed by image node id. A LiveFile only gets a URL while it is
    // referenced in Storage, and React Flow node data can't hold a real LiveFile.
    Storage: {
      images: LiveMap<string, LiveFile>
    }
    UserMeta: {
      id: string
      info: {
        name: string
        avatar: string
        color: string
      }
    }
    // Where the comment pin lives. x/y are canvas coordinates at creation. When the
    // comment was placed on a node, nodeId + offset keep the pin attached to it.
    ThreadMetadata: {
      x: number
      y: number
      nodeId?: string
      offsetX?: number
      offsetY?: number
    }
    // One AI chat message (Liveblocks Feeds). Stores the author so everyone sees who
    // sent what; assistant replies add reasoning and follow-up suggestions.
    FeedMessageData: {
      role: 'user' | 'assistant'
      content: string
      userId?: string
      name?: string
      avatar?: string
      reasoning?: string
      suggestions?: string[]
      // True while the reply is still streaming in.
      streaming?: boolean
      // Canvas objects the user selected and attached to their message.
      context?: Array<{
        type: string
        label: string
      }>
      // Board tools the agent invoked for this reply, shown as steps in the chat.
      tools?: Array<{
        type: string
        toolName: string
        toolCallId: string
        state: 'input-available' | 'output-available' | 'output-error'
        input?: Json
        output?: Json
        errorText?: string
      }>
    }
    FeedMetadata: {
      title?: string
    }
  }
}

export {}
