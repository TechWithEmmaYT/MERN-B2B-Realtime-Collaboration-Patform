import { COLORS, CONTENT_X, introCards, note } from "./helpers";
import type { BoardTemplateContent } from "./types";

// A white frame with a topic header and a loose cluster of mostly yellow sticky
// notes (matching the Brainstorming preview).

const FRAME = "b-frame";

export const brainstormTemplate: BoardTemplateContent = {
  nodes: [
    ...introCards(
      "b",
      "Brainstorm",
      "Add one idea per sticky note, then group similar ideas and vote on the best ones.",
    ),

    {
      id: FRAME,
      type: "frame",
      position: { x: CONTENT_X, y: 0 },
      data: { label: "Brainstorm", color: "#FFFFFF" },
      width: 960,
      height: 560,
      zIndex: -1,
    },

    {
      id: "b-topic",
      type: "shape",
      parentId: FRAME,
      position: { x: 280, y: 40 },
      data: { label: "What should we build next?", shape: "rectangle", color: COLORS.black },
      width: 400,
      height: 70,
    },

    // Row 1
    note("b-n1", "Onboarding checklist", COLORS.noteYellow, 60, 150, FRAME),
    note("b-n2", "AI summaries", COLORS.noteYellow, 230, 150, FRAME),
    note("b-n3", "Dark mode", COLORS.notePink, 400, 150, FRAME),
    note("b-n4", "Slack integration", COLORS.noteYellow, 570, 150, FRAME),
    note("b-n5", "Templates gallery", COLORS.noteBlue, 740, 150, FRAME),

    // Row 2
    note("b-n6", "Mobile app", COLORS.noteYellow, 60, 330, FRAME),
    note("b-n7", "Comments on shapes", COLORS.noteBlue, 230, 330, FRAME),
    note("b-n8", "Export to PDF", COLORS.noteYellow, 400, 330, FRAME),
    note("b-n9", "Keyboard shortcuts", COLORS.notePink, 570, 330, FRAME),
    note("b-n10", "Team analytics", COLORS.noteYellow, 740, 330, FRAME),
  ],
  edges: [],
};
