import { COLORS, CONTENT_X, introCards, note } from "./helpers";
import type { BoardTemplateContent, TemplateNode } from "./types";

// Three coloured quarter frames (blue, pink, green), each holding milestone notes
// (matching the Product roadmap preview's three columns).

const quarter = (id: string, label: string, color: string, index: number): TemplateNode => ({
  id,
  type: "frame",
  position: { x: CONTENT_X + index * 320, y: 0 },
  data: { label, color },
  width: 280,
  height: 620,
  zIndex: -1,
});

export const roadmapTemplate: BoardTemplateContent = {
  nodes: [
    ...introCards(
      "r",
      "Roadmap",
      "Add a note for each milestone and drag it into the quarter it ships in.",
    ),

    quarter("r-q1", "Q1", "#DBEAFE", 0),
    quarter("r-q2", "Q2", "#FCE7F3", 1),
    quarter("r-q3", "Q3", "#D1FAE5", 2),

    note("r-1a", "Research", COLORS.noteBlue, 50, 30, "r-q1", 180),
    note("r-1b", "Define scope", COLORS.noteYellow, 50, 230, "r-q1", 180),
    note("r-1c", "User interviews", COLORS.noteYellow, 50, 430, "r-q1", 180),

    note("r-2a", "Design", COLORS.notePink, 50, 30, "r-q2", 180),
    note("r-2b", "Prototype", COLORS.noteYellow, 50, 230, "r-q2", 180),
    note("r-2c", "Beta testing", COLORS.noteYellow, 50, 430, "r-q2", 180),

    note("r-3a", "Launch", COLORS.noteGreen, 50, 30, "r-q3", 180),
    note("r-3b", "Marketing push", COLORS.noteYellow, 50, 230, "r-q3", 180),
    note("r-3c", "Iterate", COLORS.noteYellow, 50, 430, "r-q3", 180),
  ],
  edges: [],
};
