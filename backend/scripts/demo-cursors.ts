// Dev only: shows demo teammates' cursors (and the AI agent) on a board, for
// screenshots and videos.
// Usage (from backend/):  npx tsx scripts/demo-cursors.ts <boardId>
// The board id is the last part of the URL: /boards/<boardId>.
// Cursors are canvas coordinates, placed for the "Product launch" template.
// They disappear on their own after TTL_SECONDS.

import { getLiveblocks } from "../src/config/liveblocks.config";

const TTL_SECONDS = 300;

const people = [
  // Brainstorm: on the circled note.
  { id: "demo-sarah", name: "Sarah Chen", color: "#F97316", cursor: { x: 330, y: 150 }, status: null },
  // User flow: on the "Invited?" diamond.
  { id: "demo-david", name: "David Okafor", color: "#8B5CF6", cursor: { x: 1290, y: 260 }, status: null },
  // Roadmap: on a Q2 note.
  { id: "demo-maria", name: "Maria Lopez", color: "#10B981", cursor: { x: 520, y: 790 }, status: null },
  // Goals: the agent next to its rocket. Same id/name/colour as the real agent.
  { id: "ai-agent", name: "AI Agent", color: "#FFD21F", cursor: { x: 1740, y: 700 }, status: "Drawing a rocket…" },
];

async function main() {
  const boardId = process.argv[2];
  if (!boardId) {
    console.error("Usage: npx tsx scripts/demo-cursors.ts <boardId>");
    process.exit(1);
  }
  const roomId = `board_${boardId}`;

  await Promise.all(
    people.map((person) =>
      getLiveblocks().setPresence(roomId, {
        userId: person.id,
        data: { cursor: person.cursor, promptingFeedId: null, aiStatus: person.status },
        userInfo: { name: person.name, avatar: "", color: person.color },
        ttl: TTL_SECONDS,
      }),
    ),
  );

  console.log(`Showing ${people.length} demo cursors on ${roomId} for ${TTL_SECONDS / 60} minutes.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
