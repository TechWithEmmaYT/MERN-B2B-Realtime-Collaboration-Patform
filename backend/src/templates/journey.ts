import { COLORS, CONTENT_X, introCards, note } from "./helpers";
import type { BoardTemplateContent, TemplateNode } from "./types";

// Three stages (yellow, blue, purple) joined left to right, with notes under each
// stage (matching the User journey map preview).

const FRAME = "j-frame";

const stage = (id: string, label: string, color: string, x: number): TemplateNode => ({
  id,
  type: "shape",
  parentId: FRAME,
  position: { x, y: 40 },
  data: { label, shape: "oval", color },
  width: 180,
  height: 72,
});

export const journeyTemplate: BoardTemplateContent = {
  nodes: [
    ...introCards(
      "j",
      "User journey",
      "Add what the user does and feels at each stage, then mark the pain points.",
    ),

    {
      id: FRAME,
      type: "frame",
      position: { x: CONTENT_X, y: 0 },
      data: { label: "User journey", color: "#FFFFFF" },
      width: 1000,
      height: 540,
      zIndex: -1,
    },

    stage("j-s1", "Discover", COLORS.yellow, 60),
    stage("j-s2", "Sign up", COLORS.blue, 410),
    stage("j-s3", "Onboard", COLORS.purple, 760),

    // Notes centred under each stage.
    note("j-d1", "Finds Kano on YouTube", COLORS.noteYellow, 75, 150, FRAME),
    note("j-d2", "Watches a demo", COLORS.noteYellow, 75, 330, FRAME),
    note("j-d3", "Creates an account", COLORS.noteBlue, 425, 150, FRAME),
    note("j-d4", "Sets up a workspace", COLORS.noteBlue, 425, 330, FRAME),
    note("j-d5", "Creates first board", COLORS.notePurple, 775, 150, FRAME),
    note("j-d6", "Invites the team", COLORS.notePurple, 775, 330, FRAME),
  ],
  edges: [
    { id: "j-e1", source: "j-s1", sourceHandle: "right", target: "j-s2", targetHandle: "left" },
    { id: "j-e2", source: "j-s2", sourceHandle: "right", target: "j-s3", targetHandle: "left" },
  ],
};
