# Next up: teams and boards

Follows [the implementation plan](../plans/2026-09-24-kano-collaboration-platform.md)
(Phase 2 team CRUD + Phase 6 dashboard). The hierarchy is **Workspace → Teams → Boards**:
every board belongs to exactly one team, and people see a team's boards by being in that team.

## Where we are

| Piece | Status |
| --- | --- |
| `Team`, `TeamMembership` models + indexes | ✅ exist, unused |
| `requireWorkspace`, `requireRole("team:manage")` | ✅ exist (owner + admin have `team:manage`) |
| Team API | ❌ none |
| `Board` model + API | ❌ none |
| Sidebar teams list, boards table | Mock data |

## Final decisions (locked 2026-09-25)

Everything below this section is the detail behind these. Change a decision here first.

### Structure and access

1. **Workspace → Teams → Boards.** A board belongs to exactly one team.
2. **Every workspace gets a "General" team**, created with the workspace in the same
   transaction, with the owner as a member. Accepted invites join the workspace **and** General.
3. **Team visibility:** owners/admins see all teams; members see only their own teams.
4. **Only owners/admins create, rename or archive teams** (`team:manage`). Anyone in a team can
   create and edit that team's boards.
5. **Selected team is in the URL**: `/dashboard/org/:workspaceId?team=<teamId>`, falling back to
   the first team.
6. **Archive, never hard-delete**, for teams and boards. The last team cannot be archived.

### Where data lives

7. **MongoDB = metadata**: `Board` (title, description, icon, team, owner, `starredBy`,
   `roomId`, dates, `archivedAt`) and `BoardVisit` (per-user "last opened").
8. **Liveblocks = canvas**: nodes and edges synced by `@liveblocks/react-flow`, plus
   `boardMeta { background }` in Storage. Canvas content is never copied into Mongo.
9. **Liveblocks Presence = cursors and selection.** Temporary, never saved.
10. **The title has one source of truth: Mongo.** It is copied into the room's metadata for
    Liveblocks features (notifications), and not stored in Storage.
11. **Mongo only learns about canvas edits via the `storageUpdated` webhook**, which sets
    `Board.updatedAt`.

### Dashboard board list

12. **No sorting controls.** The list is always ordered by `updatedAt`, most recently edited
    first.
13. **Columns:** select · name + description + icon · **People** (static team member count) ·
    Last opened (the caller's own visit, shown as "—" if never, display only) · owner · star ·
    actions.
14. **No live "online users" on the dashboard.** Live presence exists only on the board page.
15. **Star and "last opened" are per user.** Pagination is 20 per page.

### Liveblocks

16. **Mapping:** workspace = `organizationId`, team = group (`groupIds`), board = room
    `board_<boardId>`.
17. **Rooms are private** (`defaultAccesses: []`), with write access for the board's team only
    (`groupsAccesses: { [teamId]: ["room:write"] }`). Rooms are created by our backend with
    `getOrCreateRoom` when a board is created. If that fails, the board is rolled back.
18. **ID-token auth** through `POST /api/v1/liveblocks-auth`, using the client's
    `authEndpoint` **callback**. Denials return `{ error: "forbidden" }`.
19. **Idle tabs disconnect after 15 minutes** (`backgroundKeepAliveTimeout`).
20. **AI agent** follows plan Phase 10: snapshot → `setPresence` → `mutateFlow` → hide.
21. **AI panel chat and agent status live in Liveblocks Feeds** (`createFeedMessage`,
    `updateFeedMessage`, `useFeedMessages`). Replies stream into one message. The history is
    shared with everyone on the board, so there is no chat table in Mongo.
32. **AI panel UI uses Vercel AI Elements** for the chat parts only (installed per component,
    shadcn-style). The panel shell is our own. Reference implementation: Liveblocks'
    "Realtime AI Elements chats" example (see the AI Agent section).

### Canvas

22. **Engine: `@liveblocks/react-flow`** (`useLiveblocksFlow`). Every object is a node and
    every connector is an edge, which gives us built-in grouped undo/redo, cursors and
    server-side edits. This retires the plan's hand-rolled `layers` and its #1 risk (connector
    routing).
23. **v1 tools:** AI, Select, Note, Text, Shape, Connector, Draw (custom path node), Image,
    Frame, Comment, and **Diagram**. Diagram is an *insert action*, not a node type: it drops
    real, pre-laid-out shapes and connectors (flowchart, mind map, org chart) from a template
    or the AI.
24. **Later tiers:** v1.1 = Table, Kanban, Timeline (custom nodes with synced `data`, each with
    a matching AI tool). Later = Doc (Tiptap node with `field: nodeId`, editor mounted only
    when selected). Deferred tools show as "Coming soon" in the More popover.
25. **Text in Note/Text nodes:** `LiveText` for true simultaneous typing, **if** React Flow node
    `data` supports it (verify first). Otherwise a plain string plus a presence
    `editingNodeId` soft lock ("Joe is editing").
26. **Images** upload with `useUploadFile` (stored by Liveblocks, no S3).
27. **Restore is in v1, minimal:** a version list with restore
    (`useHistoryVersions` / `useRestoreToStorageVersion`) and "Undo AI change", backed by the
    snapshot the agent takes before every write.
28. **`LiveblocksProvider throttle={16}`** for smooth dragging.
29. **Board header:** logo · title ▾ · ☆ · ⋯ on the left; avatar stack · comments · **Share ▾**
    on the right. **No Present button.**
30. **Share dialog is team-based:** list the team's members (from Mongo), invite people to the
    team, copy link. No per-person room grants (`usersAccesses`) in v1.
31. **Comments:** `FloatingComposer` + `CommentPin` pinned to canvas coordinates. Emails come
    from the `notification` webhook → `prepareThreadNotificationEmailAsReact` → Resend.

### Not in v1

Online users on the dashboard, sorting, Present mode and slideshow, Prototype, public share
links, per-person board access, minimap, a full version-history browser, board thumbnails.

## Data model

```ts
Board {
  _id, workspaceId, teamId,
  roomId,          // unique, e.g. `board_<id>` — the Liveblocks room
  title, description,
  iconKey,         // "roadmap" | "brainstorm" | "flow" | "notes" | "onboarding" …
  templateKey?,    // which template it was created from
  ownerId, starredBy: [userId],
  createdAt, updatedAt, archivedAt
}
// indexes: { workspaceId, teamId, archivedAt, updatedAt: -1 }, { roomId } unique

BoardVisit { _id, userId, boardId, workspaceId, lastOpenedAt }
// unique index { userId, boardId }; index { userId, workspaceId, lastOpenedAt: -1 } (Recent page)
```

## API

All under `/api/v1/workspaces/:workspaceId`, behind `protect` + `requireWorkspace`.
Services take `workspaceId` as a filter on every query (never fetch-then-check).

### Teams

| Method | Path | Who | Notes |
| --- | --- | --- | --- |
| GET | `/teams` | all members | Admin/owner: all teams. Member: own teams. Include `memberCount`. |
| POST | `/teams` | `team:manage` | `{ name }` → slug from name, unique per workspace. Creator is added as a member. |
| PATCH | `/teams/:teamId` | `team:manage` | Rename. |
| DELETE | `/teams/:teamId` | `team:manage` | Archive (`archivedAt`), block if it is the last team. |
| GET | `/teams/:teamId/members` | team members, admins | |
| POST | `/teams/:teamId/members` | `team:manage` | `{ userIds }` — must already be workspace members. |
| DELETE | `/teams/:teamId/members/:userId` | `team:manage` | |

### Boards

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/boards?teamId=&filter=all\|mine&page=` | Caller must be in the team (or admin). Ordered by `updatedAt` desc. |
| POST | `/boards` | `{ teamId, title, description?, templateKey? }` → creates the Liveblocks room in Phase 7. |
| PATCH | `/boards/:boardId` | Rename, description, icon. |
| POST | `/boards/:boardId/star` · DELETE same | Toggle the current user in `starredBy`. |
| POST | `/boards/:boardId/visit` | Upserts `BoardVisit` when the canvas opens. |
| DELETE | `/boards/:boardId` | Archive. |
| GET | `/boards/recent` · `/boards/starred` | For the Recent / Starred pages (across the user's teams). |

List response row, shaped for the table:

```ts
{
  id, title, description, iconKey, teamId,
  owner: { id, name, avatarUrl },
  memberCount: number,       // people in the board's team
  isStarred: boolean,        // computed for the caller
  lastOpenedAt: string|null, // from the caller's BoardVisit
  updatedAt
}
```

## Boards table (home page)

| Column | Source |
| --- | --- |
| ☐ select | client state (bulk actions later) |
| Name + description + icon | `title`, `description`, `iconKey` → icon/colour map on the client |
| People | `memberCount` (team size), e.g. 👥 4, static |
| Last opened | caller's `lastOpenedAt`, "—" if never; display only |
| Owner | `owner.name` + avatar |
| ☆ | `isStarred`, optimistic toggle |
| ⋮ | Open · Rename · Duplicate · Move to team · Delete |

States: `Skeleton` rows while loading, `Empty` ("No boards in this team yet" + Create board)
when the list is empty, pagination at 20 per page.

## UI

- **Sidebar → Teams:** real list from `GET /teams`. Clicking sets `?team=`. The `+` shows only
  for owner/admin and opens **Create team** dialog (name field → `POST /teams` → select it).
- **Create new / Blank board / template card:** opens **Create board** dialog — title, team
  (defaults to the selected team), template preselected if a template was clicked →
  `POST /boards` → navigate to `/boards/:boardId` (canvas page, outside `AppLayout`).
- **Team settings** (later): `/dashboard/org/:workspaceId/team` lists members and lets admins
  add/remove people.

## Liveblocks: the canvas

Sources: `.agents/skills/liveblocks-best-practices` (`create-rooms-manually`,
`authenticating-with-id-tokens`, `compartmentalize-resources-with-organizations`,
`auth-endpoint-callback`, `avoid-hitting-user-limit-in-rooms`, `ai-as-a-collaborator`,
`multiple-text-editors`) and the Liveblocks use cases: flowchart, canvas, agentic users,
AI activity feed, comments, share dialog.
Designs: `_designs/new-board-canvas-screen.png` (empty board), `_designs/board-screen.png`.

### What lives where

| Data | Stored in | Why |
| --- | --- | --- |
| Board title, team, owner, star, archive | **MongoDB** `Board` | Needed for lists, search, permissions without opening a room |
| Who opened what, when | **MongoDB** `BoardVisit` | Per-user Recent / Last opened |
| Shapes, notes, connectors, text, frames | **Liveblocks** via `@liveblocks/react-flow` (per room) | Realtime, conflict-free, saved permanently by Liveblocks |
| Uploaded images | **Liveblocks** files (`useUploadFile`) | No separate file storage |
| AI panel chat and agent status | **Liveblocks Feeds** | Streamed, persistent, shared per board |
| Cursors, selection, "what I'm doing" | **Liveblocks Presence** | Temporary, never saved |
| Comment threads on the canvas | **Liveblocks Comments** | Built-in threads, mentions, notifications |

**Rule:** canvas content is never copied into Mongo. Mongo only gets small facts back from
Liveblocks (see webhooks below). One board = one room, `Board.roomId` links them.

### Mapping our tenancy onto Liveblocks

| Kano | Liveblocks |
| --- | --- |
| Workspace | `organizationId` = `workspaceId` |
| Team | group, `groupIds` = the user's team IDs |
| Board | room, `roomId` = `board_<boardId>` |
| Room access | `defaultAccesses: []` (private) + `groupsAccesses: { [teamId]: ["room:write"] }` |

A token issued for workspace A cannot open a room in workspace B, and only members of the
board's team can join its room.

### Flow 1: create a board

1. `POST /boards { teamId, title, templateKey? }`: check that the caller is in the team.
2. Save the `Board` in Mongo with `roomId = board_<id>`.
3. `liveblocks.getOrCreateRoom(roomId, { organizationId: workspaceId, defaultAccesses: [],
   groupsAccesses: { [teamId]: ["room:write"] }, metadata: { boardId, workspaceId, teamId } })`.
   Rooms are private by default, so without `groupsAccesses` nobody can join.
4. If step 3 fails, archive or delete the Mongo board and return an error (no orphan boards).
5. If created from a template, add the template's nodes and edges on the server (`mutateFlow`).
   Otherwise the room starts empty and the client shows the "What do you want to create?"
   screen.

### Flow 2: open a board (`/boards/:boardId`, outside `AppLayout`)

1. Page loads board metadata from `GET /boards/:boardId` (title, star, team) and fires
   `POST /boards/:boardId/visit`.
2. `<LiveblocksProvider authEndpoint={callback}>` → `<RoomProvider id={roomId}>`. Use the
   **callback** form so our cookie is sent (`credentials: "include"`) and `room` is passed.
3. Backend `POST /api/v1/liveblocks-auth { room }`:
   - `protect` → find the board by `roomId`, **scoped to a workspace the user belongs to**;
   - check the user is in `board.teamId` (or is owner/admin);
   - `liveblocks.identifyUser({ userId, organizationId: board.workspaceId, groupIds: userTeamIds },
     { userInfo: { name, avatar, color } })` and return `{ body, status }`;
   - on any denial, return `{ error: "forbidden", reason }` so the client stops retrying.
4. `LiveblocksProvider backgroundKeepAliveTimeout={15 * 60 * 1000}` so idle tabs drop off and
   rooms don't hit the plan's user limit.

### Canvas data (React Flow)

```ts
// Nodes and edges are owned by @liveblocks/react-flow (useLiveblocksFlow); their `data` is
// deeply synced, so two people editing different properties of one node both win.
Node types (v1):   note | text | shape (rectangle, ellipse, diamond) | path (draw) | frame | image
Node types (v1.1): table | kanban | timeline
Edge:              connector (label?, style)

Storage  = { boardMeta: LiveObject<{ background: string }> }   // plus React Flow's own data
Presence = { cursor: { x, y } | null; selection: string[]; penColor: string | null;
             editingNodeId: string | null }
UserMeta = { id; info: { name; avatar; color } }
```

Canvas features from the designs and how they are built:

| Design element | Built with |
| --- | --- |
| Avatar stack (EU, JD, AI, +3) | `useOthers` (use `useOthersMapped`/`shallow` for performance) |
| Live cursors with names | Presence `cursor` + `userInfo.color` |
| Undo / redo | `useUndo` / `useRedo`, grouped by React Flow (a drag or a node plus its edges is one step) |
| Toolbar: Note, Text, Shape, Connector, Draw, Image, Frame | Add React Flow nodes/edges |
| Diagram (More popover) | Insert pre-laid-out nodes + edges from a template or the AI |
| Comment tool | `FloatingComposer` + `CommentPin` at canvas coordinates |
| Empty "What do you want to create?" | Shown while the board has no nodes |
| Title dropdown (rename), star | Our API (`PATCH /boards/:id`, star), not Storage |
| Share | Copy link + invite to the board's team (access is team-based) |
| Version history | Minimal restore + "Undo AI change" (`useHistoryVersions`, `useRestoreToStorageVersion`) |
| Present button | Removed |
| Minimap | Not in v1 |

### Flow 3: what gets written back to Mongo

Liveblocks webhooks → `POST /api/v1/webhooks/liveblocks`:

- verify with `new WebhookHandler(LIVEBLOCKS_WEBHOOK_SECRET).verifyRequest({ headers, rawBody })`.
  This needs the **raw** body, so mount `express.raw()` on this route before `express.json()`;
- `storageUpdated` → set `Board.updatedAt` / `lastEditedAt` (later: regenerate thumbnail);
- `notification` → comment emails via `prepareThreadNotificationEmailAsReact` → Resend;
- `commentCreated` → `@AI` mentions for the agent.

Other sync points (our API calls Liveblocks, not the reverse):

- Rename board → update Mongo + `updateRoom(roomId, { metadata: { title } })`.
- Move board to another team → update `teamId` + `updateRoom` with the new `groupsAccesses`.
- Archive board → Mongo `archivedAt`; delete the room only on permanent delete.
- User added to or removed from a team → nothing to update in the room. The new `groupIds` apply
  the next time they authenticate.

### AI Agent (right-hand panel in `board-screen.png`)

As in the plan (Phase 10). The agent is a server-side user (`userId: "ai-agent"`) and never
opens a WebSocket.

- Panel chat → `POST /api/v1/ai/boards/:boardId/chat`: check board access, reply `202` at
  once, then stream in the background (errors are logged). A stop endpoint cancels it.
- Zod tools in `backend/src/services/ai-tools.service.ts`, up to 8 steps per message:
  - Create: `createStickyNotes`, `createFlowchart`, `createRoadmap`, `addShapes`, `addText`,
    `addFrame` (can wrap existing items), `drawPicture` (strokes in a 300×300 box, drawn one by
    one as path nodes inside a titled white frame, while the agent's cursor moves).
  - Edit: `listBoardItems` (the system prompt says to call it first before touching existing
    items), `moveItems`, `moveIntoFrame`, `connectItems` (handles picked automatically,
    smoothstep edges), `updateItems`, `deleteItems`, `organizeLayout`.
  - Read: `summarizeSelection`.
  - Later: `createTable`, `createKanban`, `createTimeline`.
- The reply streams into **Liveblocks Feeds** with `createFeedMessage` / `updateFeedMessage`
  (non-blocking, batched every 150 ms). The panel renders `useFeedMessages`, so the chat is
  saved and everyone on the board sees it.
- Each tool that changes the board runs through `asAgent`, in order:
  1. `createVersionHistorySnapshot(roomId)` so people can revert the agent;
  2. `setPresence(roomId, { userId: "ai-agent", data: { cursor, promptingFeedId: null, aiStatus } })`,
     so "AI" appears in the avatar stack and its cursor sits on the area being changed;
  3. `mutateStorage` writes `flow.nodes` / `flow.edges`, which everyone sees live;
  4. status "Done", then the presence expires (`ttl` 3).

#### Agent presence and status

- Presence has `aiStatus` (e.g. "Adding notes…", "Drawing flower…", "Done").
- The agent's cursor label reads `AI Agent · <status>`, and the panel header shows the same
  status (read with `useOthers`) in place of "Online".
- `promptingFeedId`: while you wait for a reply, your presence names the chat, so others in that
  chat also see "Thinking…".
- Server writes are not transactions, so keep each tool's write small and idempotent.
- Quick actions (Brainstorm ideas, Create a flowchart, Plan a roadmap, Summarize selected
  objects) are preset prompts. Per-workspace daily cap.

#### Panel UI

A panel docked on the right (the canvas narrows), not an overlay `Sheet`. It opens from the
✨ AI button on the toolbar.

| Part of the design | Built with |
| --- | --- |
| Header: "AI Agent ▾ · Online · Member of this workspace", new chat, history, ⋯, ✕ | Our own (shadcn `Button`, `DropdownMenu`) |
| "Hey Emmanuel" greeting + quick actions | AI Elements **Suggestion** (or plain buttons) |
| Message list, auto-scroll | AI Elements **Conversation** |
| Each reply (markdown, streaming) | AI Elements **Message** + its response part |
| "Creating 5 sticky notes…" steps | AI Elements **Tool** + a loader/shimmer |
| "Select objects on the canvas to add context" + input + icon row | AI Elements **PromptInput**, our buttons in its toolbar |

- Install only these components with `npx ai-elements add <component>`, not the whole set.
  Confirm the exact component names at install time.
- AI Elements only **renders**. Messages come from `useFeedMessages` and are mapped into its
  components; it stores nothing.
- Not Liveblocks `AiChat`: that uses Liveblocks' own hosted AI, which doesn't fit our
  backend + AI SDK tools + `mutateFlow` setup.

Built (`client/src/components/board/ai-agent-panel.tsx`):

- Docked `w-96` panel. A new chat (feed id from `nanoid()`) each time it opens; History lists
  older chats, titled from the first 60 characters of the first message.
- Your message and a "Thinking…" bubble show at once, before the feed catches up. A guard
  stops double sends.
- Messages are sorted by `createdAt`. Avatars and names use the shared `UserAvatar` /
  `useUser`, so they match the header stack ("AI" for the agent).
- Actions on finished replies: Copy (with a fallback when the clipboard API is blocked) and
  Regenerate (deletes the last reply and asks again).
- Follow-up `Suggestions` render when the backend sends `suggestions` (not sent yet).

#### Reference example

Liveblocks "Realtime AI Elements chats":
<https://liveblocks.io/examples/ai-elements-realtime/nextjs-ai-elements-realtime> (code:
`liveblocks/liveblocks` → `examples/nextjs-ai-elements-realtime`). It matches our design:
Feeds store the chat, the server streams replies with `createFeedMessage` /
`updateFeedMessage`, clients read `useFeedMessages`, AI Elements renders reasoning, tool calls
and sources, and there is an avatar stack plus an "AI is thinking" indicator.

What we change from it:

1. Next.js route → Express `POST /api/v1/ai/boards/:boardId/chat`, with the board-access check.
2. Chat-only → tools that also edit the board (snapshot → `setPresence` → `mutateFlow`).
3. One global chat → one feed per board room.
4. Same Vercel AI Gateway (`AI_GATEWAY_API_KEY`). The model is set server-side in
   `backend/src/services/ai.service.ts` (`DEFAULT_MODEL`).

#### Model

- **`anthropic/claude-opus-5`** through the AI Gateway (changed 2026-09-28:
  `openai/gpt-4o-mini` handled the drawing and layout tools poorly, then Sonnet 5, then Opus 5).
- No `providerOptions` thinking settings. Opus 5 thinks adaptively by default and **rejects
  `budgetTokens` with a 400**, so don't add it back.
- `stopWhen: stepCountIs(8)` so the agent can call several tools per message.
- Opus 5 is the strongest and priciest option (about 2.5× Sonnet 5 per token), so watch the gateway credits. To save cost, switch `DEFAULT_MODEL` back to `anthropic/claude-sonnet-5`; nothing else changes.

Read the example's code before building the panel: it shows which AI Elements components it
installs and how it maps feed messages into them.

#### Liveblocks Free plan

Checked 2026-09-25 against the pricing page, Feeds docs, launch blog and the AI activity feed
use case. None of them state which plans include Feeds.

- Pricing says "All plans include: Sync, Comments, and Notifications", and Feeds is documented
  under Sync (`/docs/products/sync/feeds`). The example needs only a Liveblocks API key.
  So Feeds is **probably** on Free. This is an inference, not confirmed.
- Free limits that affect Kano: 10 simultaneous connections per room, 10 MB storage per room,
  512 MB file storage, 200 comments, **24 hours of version history** (Restore and "Undo AI
  change" only reach back 24 hours on Free).
- To confirm: create one feed message from the backend once Liveblocks is installed. The API
  errors immediately if the plan doesn't allow it.
- Fallback if Feeds isn't available: a MongoDB `AiMessage` collection with AI SDK streaming.
  Nothing else in the plan changes.

### Env

`LIVEBLOCKS_SECRET_KEY` and `LIVEBLOCKS_WEBHOOK_SECRET` (backend only). The client needs no
key because it authenticates through our endpoint.

## Suggested order

1. Backend: default "General" team on workspace create + `GET/POST /teams`.
2. Frontend: sidebar teams from the API, Create team dialog, `?team=` selection.
3. Backend: `Board` + `BoardVisit` models, list/create/star/visit endpoints.
4. Frontend: boards table from the API with loading/empty states, Create board dialog.
5. Recent and Starred pages reuse the same table.
6. Liveblocks: room created with the board, `/liveblocks-auth`, board page shell (top bar,
   toolbar, zoom) with cursors + avatar stack.
7. React Flow canvas: v1 node types, connectors, undo/redo, empty-board start screen,
   templates, Diagram insert, image upload, comments.
8. Webhooks (`storageUpdated` → `updatedAt`).
9. AI Agent panel: Feeds chat, presence, `mutateFlow` writes, "Undo AI change" + restore.
10. v1.1: Table, Kanban, Timeline nodes with matching AI tools.
