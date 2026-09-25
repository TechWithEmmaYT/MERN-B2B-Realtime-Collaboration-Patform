# Kano — B2B Realtime Collaboration Platform

**Date:** 2026-09-24
**Status:** Approved for implementation (amended 2026-09-25)
**Source spec:** discovery interview (plan-project skill)
**Teams, boards and Liveblocks detail:** [docs/notes/2026-09-25-teams-and-boards.md](../notes/2026-09-25-teams-and-boards.md)
— its "Final decisions" section is authoritative where the two differ.

A Miro-style collaborative canvas where teams and an AI agent work on the same board
simultaneously. Workspaces contain teams, teams contain boards, and every board is a
Liveblocks room.

---

## 1. Confirmed decisions

| Area | Decision |
| --- | --- |
| Tenancy | Workspace → Teams → Boards (full hierarchy) |
| Canvas source of truth | Liveblocks Storage; MongoDB holds board metadata only |
| Board title | MongoDB only (copied into room metadata); never in Storage |
| Default team | Every workspace gets a "General" team; accepted invites join it |
| Authentication | Email/password **and** Google OAuth, both issuing one HTTP-only JWT cookie |
| Liveblocks auth | ID tokens with `organizationId` (workspace) + `groupIds` (teams) |
| Room creation | Manual via `getOrCreateRoom` with `groupsAccesses` |
| Canvas engine | `@liveblocks/react-flow` — objects are nodes, connectors are edges |
| AI agent | Server-side Vercel AI SDK → `mutateFlow`, visible as a room member |
| AI chat | Liveblocks Feeds for the panel's messages and agent status |
| AI safety | Zod tool-calling + `createVersionHistorySnapshot` before every write |
| Comments | Liveblocks Comments + inbox notifications + Resend mention emails |
| Canvas tools (v1) | note, text, shape, connector, draw, frame, image, comment, Diagram insert |
| Version restore | Minimal restore + "Undo AI change" in v1 |
| Styling | Tailwind v4 + shadcn/ui, yellow `#FFD21F` primary |

### Out of scope for v1

Billing and plans (the "Upgrade plan" card is decorative), Present mode and the Present
button, slides, prototype, public share links, per-person board access, mobile-native apps,
SSO/SAML, custom roles, live online users on the dashboard, board-list sorting, minimap, a
full version-history browser, board thumbnails. Table / kanban / timeline follow in v1.1;
doc later.

---

## 2. Architecture

```
client/  Vite + React 19 SPA
  └── Liveblocks React (Storage, Presence, Comments)
        │  ID token from backend
        ▼
backend/ Express + TypeScript (route → controller → service → model)
  ├── MongoDB (Mongoose)  users, workspaces, teams, memberships, invitations, boards
  ├── @liveblocks/node    auth, room provisioning, agent mutations
  ├── Resend              invitations + comment notification emails
  └── Vercel AI SDK       agent tool-calling
```

**Tenant isolation is enforced in two places.** MongoDB queries are always scoped by an
authorized `workspaceId`, and Liveblocks rooms carry the same `organizationId` so a token
minted for workspace A cannot reach a room in workspace B.

### Skills that govern each area

| Work | Skill |
| --- | --- |
| Backend structure, Passport cookie auth, Mongo setup | `nodejs-scaffolding` |
| Workspaces, teams, memberships, invitations, RBAC | `nodejs-organizations` |
| Rooms, auth tokens, Storage, presence, comments, agent | `liveblocks-best-practices` |
| Invitation + notification email | `resend` |
| All UI components and styling rules | `shadcn` |

`yjs-best-practices` is **not** used — it applies to Yjs text editors, not a Storage-backed
canvas. Only pull it in if a doc/notes editor is added later.

---

## 3. Data model (MongoDB)

```ts
User          { _id, name, email (unique, lowercase), password?, googleId?, avatarUrl,
                emailVerifiedAt, createdAt }
Workspace     { _id, name, slug (unique), iconType, iconValue, ownerId, createdAt,
                archivedAt }
Membership    { _id, userId, workspaceId, role: owner|admin|member, joinedAt }
                // unique compound index (userId, workspaceId)
Team          { _id, workspaceId, name, slug, createdAt, archivedAt }
                // unique compound index (workspaceId, slug)
TeamMembership{ _id, teamId, userId, workspaceId, addedAt }
                // unique compound index (teamId, userId)
Invitation    { _id, workspaceId, teamId?, email (normalized), role, invitedBy,
                tokenHash, expiresAt, status: pending|accepted|revoked|expired,
                acceptedAt, acceptedBy }
                // unique partial index (workspaceId, email) where status = pending
Board         { _id, workspaceId, teamId, roomId (unique), title, description,
                iconKey, templateKey?, ownerId, starredBy[], createdAt,
                updatedAt, archivedAt }
                // updatedAt is bumped by the Liveblocks storageUpdated webhook
BoardVisit    { _id, userId, boardId, workspaceId, lastOpenedAt }
                // unique compound index (userId, boardId); powers "Last opened" + Recent
AuditEvent    { _id, workspaceId, actorId, action, targetType, targetId, metadata,
                createdAt }
```

Canvas content is **not** in Mongo. It lives in the Liveblocks room keyed by `Board.roomId`.

### Permission matrix

| Action | Owner | Admin | Member |
| --- | --- | --- | --- |
| View workspace + own teams' boards | ✅ | ✅ | ✅ |
| Create / edit boards in own teams | ✅ | ✅ | ✅ |
| Invite / remove members, change roles | ✅ | ✅ | ❌ |
| Create / delete teams | ✅ | ✅ | ❌ |
| Rename / delete workspace | ✅ | ❌ | ❌ |
| Transfer ownership | ✅ | ❌ | ❌ |

Rules: deny by default; the active workspace ID is **context only, never proof of
membership**; block mass assignment of `role`, `ownerId`, `workspaceId`; protect the last
owner (transfer required before leaving); prefer archive over hard delete.

---

## 4. Implementation phases

### Phase 0 — Foundations

- [ ] Add MongoDB to the backend per `nodejs-scaffolding` MongoDB mode: install `mongoose`,
      create `src/config/database.config.ts`, add `MONGO_URI` to `env.config.ts` and
      `.env.example`, connect before the server reports ready, set
      `mongoose.set("sanitizeFilter", true)` before connecting.
- [ ] Extend graceful shutdown so the `server.close` callback awaits the Mongo disconnect
      before setting the exit code.
- [ ] Add remaining env vars: `JWT_SECRET`, `JWT_EXPIRES_IN`, `GOOGLE_CLIENT_ID`,
      `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `LIVEBLOCKS_SECRET_KEY`,
      `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `EMAIL_FROM`, `APP_URL`, `AI_API_KEY`.
- [ ] Add Vitest + Supertest and an in-memory Mongo for tests.

**Done when:** `npm run dev` connects to Mongo and `/health` still returns `{"status":"ok"}`.

### Phase 1 — Authentication

Follow `nodejs-scaffolding` authentication mode.

- [ ] Install `passport passport-jwt jsonwebtoken passport-google-oauth20` + types.
- [ ] `src/models/user.model.ts` — hash password once in a pre-save hook, never return the
      password field.
- [ ] `src/config/passport.config.ts` — JWT strategy reading `req.cookies.accessToken` via
      `ExtractJwt.fromExtractors`, `session: false`; Google strategy linking by verified email.
- [ ] `src/utils/cookie.ts` — `setJwtAuthCookie` / `clearJwtAuthCookie`, HTTP-only, secure in
      production, deliberate `sameSite`, cleared with the same path/options.
- [ ] `src/validators/auth.validator.ts` — Zod schemas for register and login.
- [ ] Routes: `POST /register`, `POST /login`, `GET /google`, `GET /google/callback`,
      `POST /logout`, `GET /status` (JWT-protected).
- [ ] Non-enumerating "invalid credentials" message on login failure.

**Done when:** register → cookie set → `/status` returns the user; Google round-trip issues
the same cookie.

### Phase 2 — Organizations, teams, invitations

Follow `nodejs-organizations`. That skill requires a ≤5-bullet proposal and explicit
confirmation before writing files — do that first.

- [ ] Create a default "General" team (owner as member) in the workspace-creation transaction;
      accepted invitations also join General.
- [ ] Models + indexes for `Workspace`, `Membership`, `Team`, `TeamMembership`, `Invitation`,
      `AuditEvent`.
- [ ] `requireWorkspace` middleware resolving membership from the authenticated user and
      rejecting stale active-workspace context.
- [ ] `requireRole(...roles)` middleware; deny by default.
- [ ] Scoped service API — `findBoard({ workspaceId, boardId })` style, never fetch-then-check.
- [ ] Endpoints: workspace CRUD + slug availability, member list / role change / remove,
      ownership transfer, team CRUD + membership, invitation create (bulk) / list / revoke /
      accept.
- [ ] Invitations: normalized email, hashed single-use token, 7-day expiry, role locked at
      creation so acceptance cannot escalate.
- [ ] Audit every membership, role, invitation, ownership and destructive action.

**Done when:** tenant-isolation tests pass — two workspaces, cross-tenant reads/writes denied
with guessed IDs, invite reuse/expiry/wrong-identity rejected, last owner protected.

### Phase 3 — Email (Resend)

Follow the `resend` skill.

- [ ] Install `resend` (>= 6.14.0). Server-side only — the API does not support CORS.
- [ ] `src/services/email.service.ts`. The SDK returns `{ data, error }` and does **not**
      throw; check `error` explicitly.
- [ ] Invitation email with the accept link; use `resend.batch.send` for 2–100 invites
      (atomic — validate every address before sending) and single send for one.
- [ ] Idempotency keys: `invite/<invitationId>`, `batch-invite/<batchId>`.
- [ ] Verify a sending domain early — `onboarding@resend.dev` only delivers to the account
      owner's address, so real invites stay blocked until this is done.
- [ ] Test with `delivered@resend.dev`, never fake addresses at real providers.

**Done when:** the onboarding invite step sends real email and creates pending invitations.

### Phase 4 — Frontend foundation

- [ ] Install Tailwind v4 + `@tailwindcss/vite`, then `npx shadcn@latest init`. Verify
      compatibility with React 19 / Vite 8 / TS ~6 at install time.
- [ ] Define theme tokens in the shadcn-reported `tailwindCssFile` using `@theme inline`:

  | Token | Value |
  | --- | --- |
  | `--primary` | `#FFD21F` |
  | `--primary-foreground` | `#111111` |
  | `--background` | `#FFFFFF` |
  | `--foreground` | `#111111` |
  | `--secondary` | `#F5F6F8` |
  | `--secondary-foreground` | `#202534` |
  | `--muted` | `#F3F4F6` |
  | `--muted-foreground` | `#667085` |
  | `--border` | `#E1E4EA` |
  | `--canvas` | `#FAFBFD` |
  | `--canvas-grid` | `#DCE3ED` |
  | `--ring` | `#FFD21F` |

- [ ] React Router routes: `/register`, `/login`, `/onboarding/*`, `/invite/:token`,
      `/dashboard`, `/boards/:boardId`, `/settings/*`.
- [ ] TanStack Query + an axios instance with `withCredentials: true`; 401 interceptor →
      redirect to login.
- [ ] Auth context from `GET /auth/status`; protected-route wrapper.
- [ ] Reuse existing assets in `client/src/assets/` (logo, illustrations, tool icons).

**shadcn rules to enforce throughout:** semantic color tokens only (never `bg-yellow-400`);
`flex` + `gap-*` instead of `space-y-*`; `size-*` when width equals height; forms built from
`FieldGroup`/`Field`; `Avatar` always has `AvatarFallback`; icons in buttons use `data-icon`
with no sizing classes; no manual `z-index` on overlays. Run
`npx shadcn@latest docs <component>` before using an unfamiliar component.

### Phase 5 — Auth and onboarding UI

Designs: `_designs/auth-register-screen.png`, `auth-create-workspace-screen.png`,
`auth-invite-team-screen.png`, `auth-workspace-ready-screen.png`.

- [ ] Split layout — yellow panel with rotating headline/illustration on the left, form right.
- [ ] Register and login: Google button, divider, `FieldGroup` form, password reveal toggle.
- [ ] 3-step wizard with a shared stepper (numbered → checkmark on completion):
  1. Workspace name, slug with live availability check and `.kano.so` suffix, icon picker
     (upload or colored initials)
  2. Repeatable invite rows with per-row role selects, "Add another person", default-role
     select, "Skip for now"
  3. Summary card confirming workspace created / N invited, "Go to dashboard"
- [ ] `/invite/:token` accept page handling expired, revoked, already-accepted and
      wrong-account states.

### Phase 6 — Dashboard

Design: `_designs/dashboard-screen.png`.

- [ ] Sidebar: workspace switcher, Home / Recent / Starred / Shared with me, Teams list with
      create, AI Agent entry, upgrade card (decorative).
- [ ] Topbar: `Command` palette search (⌘K), Invite members dialog, notifications bell,
      account menu.
- [ ] Time-aware greeting, template gallery strip.
- [ ] Board list with grid/list toggle, star, row actions, pagination, `Empty` state,
      `Skeleton` loading. No sorting controls: always ordered by `updatedAt` desc.
- [ ] Board rows show a static **People** count (team size), not live presence. Live presence
      exists only on the board page.
- [ ] Members and teams settings pages.

### Phase 7 — Liveblocks integration

- [ ] Install `@liveblocks/client @liveblocks/react @liveblocks/react-ui
      @liveblocks/react-flow` (client) and `@liveblocks/node` (backend).
- [ ] `POST /api/v1/liveblocks-auth` → `identifyUser({ userId, organizationId: workspaceId,
      groupIds: teamIds }, { userInfo: { name, avatar, color } })`. Return
      `{ error: "forbidden" }` for unauthorized users so the client stops retrying.
- [ ] Client uses the `authEndpoint` **callback** form so credentials are included.
- [ ] On board creation call `getOrCreateRoom(roomId, { organizationId, defaultAccesses: [],
      groupsAccesses: { [teamId]: ["room:write"] }, metadata: { title, workspaceId } })`.
      Rooms are private by default — permissions must be set or nobody can join.
- [ ] Typed `liveblocks.config.ts` declaring `Presence`, `Storage`, `UserMeta`, `RoomEvent`,
      `ThreadMetadata`, `RoomInfo`, `GroupInfo`.
- [ ] Wrap the board in `ErrorBoundary` + `ClientSideSuspense` and use the suspense hooks.

**Canvas data** — nodes and edges are owned by `@liveblocks/react-flow` (`useLiveblocksFlow`);
node `data` is deeply synced.

```ts
Storage = {
  boardMeta: LiveObject<{ background: string }>; // title lives in MongoDB
};

Presence = {
  cursor: { x: number; y: number } | null;
  selection: string[];
  penColor: string | null;
  editingNodeId: string | null; // soft lock if LiveText is not usable in node data
};
```

### Phase 8 — Canvas

Designs: `_designs/board-screen.png`, `new-board-canvas-screen.png`.

- [ ] Left toolbar: AI, Select, Note, Text, Shape, Connector, Draw, Image, Frame, Comment,
      More. More → Diagram (insert pre-laid-out nodes + edges from a template or the AI);
      Table, Kanban, Timeline, Doc render as disabled "coming soon" entries. No Slides or
      Prototype entries.
- [ ] Node types: `note | text | shape | path | frame | image`; connectors are edges.
- [ ] Text in notes/text nodes uses `LiveText` if React Flow node `data` supports it (verify
      first); otherwise a plain string with an `editingNodeId` presence soft lock.
- [ ] Images upload with `useUploadFile`.
- [ ] Pan/zoom, selection, multi-select, resize, z-ordering, duplicate, delete, grouped
      undo/redo (`useUndo` / `useRedo`). `LiveblocksProvider throttle={16}`.
- [ ] Minimal version restore (`useHistoryVersions` / `useRestoreToStorageVersion`).
- [ ] Live cursors with name labels and per-user colors; presence avatar stack with overflow.
- [ ] Empty state: "What do you want to create?" with template cards and the AI prompt bar.
- [ ] Header: title rename, star, board menu, avatar stack, comments, Share (team-based:
      list team members, invite to team, copy link). No Present button. Zoom controls.
- [ ] Performance — mandatory:
  - Memoize custom node components; never subscribe to the whole Storage root.
  - `useOthersMapped` / `useOtherConnectionIds` for cursors so one moving pointer does not
    re-render every layer.
  - Configure the `exhaustive-deps` ESLint rule for `useMutation` to avoid stale closures.

**Risk:** freehand drawing is the one tool that does not map naturally onto React Flow nodes;
build it as a custom `path` node sized to its stroke bounds.

### Phase 9 — Comments and notifications

- [ ] Canvas-anchored threads using `ThreadMetadata: { x, y, nodeId? }` with `FloatingComposer`
      and `CommentPin`; `Thread` renders the conversation.
- [ ] Inbox bell via `useInboxNotifications` + `InboxNotification`.
- [ ] `POST /api/v1/webhooks/liveblocks` — verify the signature; on `notification` build the
      email with `@liveblocks/emails` (`prepareThreadNotificationEmailAsReact`) and send through
      Resend with an idempotency key; on `storageUpdated` bump `Board.updatedAt`.
- [ ] Resolve user and room info so mentions render names and avatars rather than raw IDs.

### Phase 10 — AI agent

- [ ] Install `ai` + a provider SDK on the backend.
- [ ] `POST /api/v1/ai/boards/:boardId/chat` — authorize board access, then stream.
- [ ] Tools with Zod schemas: `createStickyNotes`, `createFlowchart`, `createRoadmap`,
      `summarizeSelection`, `organizeLayout`.
- [ ] Every mutating tool follows this order:
  1. `createVersionHistorySnapshot(roomId)` so the user can revert the agent
  2. `setPresence(roomId, { userId: "ai-agent", userInfo: { name: "AI Agent", color }, ttl: 60 })`
  3. `mutateFlow` to write nodes and edges
  4. `setPresence(..., { ttl: 2 })` to hide the agent when finished
- [ ] The `ai-agent` user resolves through the same user-info resolver, so the existing avatar
      stack and cursors show it with no extra UI — exactly as the board design shows.
- [ ] Right-hand panel: greeting, quick actions (Brainstorm ideas, Create a flowchart, Plan a
      roadmap, Summarize selected objects), "select objects to add context" hint,
      per-workspace daily request cap.
- [ ] Chat messages and agent status stream into Liveblocks Feeds (`createFeedMessage`,
      `updateFeedMessage`); the panel renders `useFeedMessages`.
- [ ] "Undo AI change" restores the snapshot taken in step 1.

> Server-side mutations are not database transactions — changes made before an `await` can
> flush before later work completes. Keep each tool's mutation tight and idempotent.

### Phase 11 — Hardening

- [ ] Tenant-isolation suite (two workspaces, every role, guessed IDs).
- [ ] Invitation lifecycle tests: expiry, reuse, wrong identity, revocation, role tampering.
- [ ] Last-owner protection and ownership transfer tests.
- [ ] Typecheck, lint, build on both apps; verify the dev server boots and `/health` responds.
- [ ] Confirm no secret, cookie, token or raw body reaches the logs.

---

## 5. Assumptions to validate

- Workspace slug is stored and validated but **not** a real subdomain; `.kano.so` is display
  only in v1.
- Google OAuth links to an existing account when the verified email matches; no separate
  account-linking UI.
- Invitations expire after 7 days. A board belongs to exactly one team.
- One AI provider via Vercel AI SDK, with a per-workspace daily cap.
- Boards and workspaces are archived (soft-deleted), not hard-deleted.

---

## 6. Open risks

1. **Freehand drawing on React Flow** — needs a custom path node; everything else maps to
   nodes and edges.
2. **Resend domain verification** blocks real invite delivery until completed.
3. **Liveblocks plan limits** on rooms and concurrent users may cap testing.
4. **Agent/human edit collisions** during bulk generation; snapshots and "Undo AI change"
   mitigate, but server mutations are not transactional.
8. **Unverified APIs** — confirm `LiveText` inside React Flow node data, the import path of
   `mutateFlow`, and Feeds availability on our Liveblocks plan before building on them.
5. **Toolchain freshness** — React 19, Vite 8, TS ~6 versus Tailwind v4 / shadcn.
6. **Secrets not yet provisioned** — Mongo, JWT, Google, Liveblocks, Resend, AI provider.
7. **`ts-node` is incompatible with the installed TypeScript**; the backend dev runner is
   `tsx`. Keep it that way.
