# Kano

A B2B realtime collaboration platform — a Miro-style canvas where teams and an AI agent
work on the same board simultaneously.

- `backend/` — Express + TypeScript API (route → controller → service → model)
- `client/` — Vite + React 19 SPA
- `_designs/` — reference screens for every major view

## Project documents

- [Implementation plan](./docs/plans/2026-09-24-kano-collaboration-platform.md) — scope,
  data model, permission matrix, and phased delivery for the v1 platform.
- [Teams, boards and Liveblocks notes](./docs/notes/2026-09-25-teams-and-boards.md) — locked
  decisions for teams, the board list, and how canvas data is split between MongoDB and
  Liveblocks.

## Notes

- The backend dev runner is `tsx`, not `ts-node` (`ts-node` is incompatible with the
  installed TypeScript version).
- Canvas content lives in Liveblocks Storage; MongoDB stores board metadata only.
