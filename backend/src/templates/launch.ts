import { COLORS, note } from "./helpers";
import type { BoardTemplateContent, TemplateEdge, TemplateNode } from "./types";

// A full product-launch board that uses every canvas tool: frames, sticky notes,
// text, shapes (rectangle, oval, rhombus, triangle, block arrow), connectors with
// labels and pen drawings. Four frames: Brainstorm, User flow, Roadmap, Goals.

const WHITE = "#FFFFFF";
const LIGHT_YELLOW = "#FEF9C3";
const LIGHT_BLUE = "#DBEAFE";
const RED = "#EF4444";
const INK = "#1F1F1F";

type Point = { x: number; y: number };

const shape = (
  id: string,
  kind: "rectangle" | "oval" | "rhombus" | "triangle" | "block-arrow",
  label: string,
  color: string,
  x: number,
  y: number,
  width: number,
  height: number,
  parentId?: string,
): TemplateNode => ({
  id,
  type: "shape",
  position: { x, y },
  data: { label, shape: kind, color },
  width,
  height,
  ...(parentId ? { parentId } : {}),
});

const text = (id: string, label: string, x: number, y: number, width: number, height: number, parentId?: string): TemplateNode => ({
  id,
  type: "text",
  position: { x, y },
  data: { label },
  width,
  height,
  ...(parentId ? { parentId } : {}),
});

const frame = (id: string, label: string, color: string, x: number, y: number, width: number, height: number): TemplateNode => ({
  id,
  type: "frame",
  position: { x, y },
  data: { label, color },
  width,
  height,
  zIndex: -1,
});

// A pen stroke; the node is placed at the points' top-left and the points are
// stored relative to it, like strokes drawn with the Draw tool.
const stroke = (
  id: string,
  parentId: string,
  x: number,
  y: number,
  points: Point[],
  color = INK,
  size: "thin" | "medium" | "thick" = "medium",
): TemplateNode => {
  const minX = Math.min(...points.map((p) => p.x));
  const minY = Math.min(...points.map((p) => p.y));
  const relative = points.map((p) => ({ x: Math.round(p.x - minX), y: Math.round(p.y - minY) }));
  return {
    id,
    type: "path",
    parentId,
    position: { x: x + minX, y: y + minY },
    width: Math.max(8, ...relative.map((p) => p.x)),
    height: Math.max(8, ...relative.map((p) => p.y)),
    data: { label: "", points: relative, color, size, mode: "pen" },
  };
};

const ellipse = (cx: number, cy: number, rx: number, ry: number, steps = 24): Point[] =>
  Array.from({ length: steps + 1 }, (_, i) => {
    const angle = (i / steps) * Math.PI * 2;
    return { x: cx + Math.cos(angle) * rx, y: cy + Math.sin(angle) * ry };
  });

const arrow = (
  id: string,
  source: string,
  sourceHandle: TemplateEdge["sourceHandle"],
  target: string,
  targetHandle: TemplateEdge["targetHandle"],
  label?: string,
): TemplateEdge => ({
  id,
  source,
  sourceHandle,
  target,
  targetHandle,
  type: "smoothstep",
  ...(label ? { label } : {}),
});

const BRAIN = "l-brainstorm";
const FLOW = "l-flow";
const ROAD = "l-roadmap";
const GOALS = "l-goals";

export const launchTemplate: BoardTemplateContent = {
  nodes: [
    // Header.
    shape("l-title", "rectangle", "Kano launch plan\nOne board for the team and the AI agent", COLORS.yellow, 0, -170, 520, 110),
    text("l-kickoff", "Kickoff: Monday 10:00\nOwner: Product team · Status: In progress", 560, -150, 420, 70),

    // Frames first (children must come after their frame).
    frame(BRAIN, "Brainstorm", LIGHT_YELLOW, 0, 0, 640, 480),
    frame(FLOW, "User flow", WHITE, 720, 0, 1160, 480),
    frame(ROAD, "Roadmap", LIGHT_BLUE, 0, 560, 1100, 440),
    frame(GOALS, "Goals", WHITE, 1180, 560, 700, 440),

    // Brainstorm: sticky notes, with the best idea circled by hand.
    note("l-n1", "Invite-only beta for design teams", COLORS.noteYellow, 40, 60, BRAIN),
    note("l-n2", "AI agent builds the first board for you", COLORS.notePink, 245, 60, BRAIN),
    note("l-n3", "Template gallery", COLORS.noteBlue, 450, 60, BRAIN),
    note("l-n4", "Launch video with live cursors", COLORS.noteGreen, 40, 270, BRAIN),
    note("l-n5", "Slack + email invites", COLORS.notePurple, 245, 270, BRAIN),
    note("l-n6", "Free plan: 3 boards", COLORS.noteOrange, 450, 270, BRAIN),
    stroke("l-circle", BRAIN, 0, 0, ellipse(320, 135, 108, 100), RED, "medium"),
    text("l-best", "Top pick!", 360, 20, 110, 32, BRAIN),

    // User flow: every basic shape, joined with labelled connectors.
    shape("l-start", "oval", "Visit kano.app", COLORS.blue, 40, 200, 160, 90, FLOW),
    shape("l-signup", "rectangle", "Sign up", COLORS.blue, 260, 205, 160, 80, FLOW),
    shape("l-invited", "rhombus", "Invited?", COLORS.yellow, 490, 185, 120, 120, FLOW),
    shape("l-join", "rectangle", "Join the team", COLORS.purple, 690, 70, 170, 80, FLOW),
    shape("l-create", "rectangle", "Create a workspace", COLORS.orange, 690, 340, 170, 80, FLOW),
    shape("l-open", "oval", "Open first board", COLORS.green, 940, 200, 170, 90, FLOW),

    // Roadmap: quarter headers linked by block arrows, notes under each.
    shape("l-q1", "rectangle", "Q1 · Build", COLORS.purple, 40, 60, 280, 60, ROAD),
    shape("l-a1", "block-arrow", "", "#D4D4D8", 335, 70, 70, 40, ROAD),
    shape("l-q2", "rectangle", "Q2 · Launch", COLORS.pink, 420, 60, 280, 60, ROAD),
    shape("l-a2", "block-arrow", "", "#D4D4D8", 715, 70, 70, 40, ROAD),
    shape("l-q3", "rectangle", "Q3 · Grow", COLORS.green, 800, 60, 260, 60, ROAD),
    note("l-r1", "Realtime canvas", COLORS.noteYellow, 40, 150, ROAD, 130),
    note("l-r2", "Teams + roles", COLORS.noteYellow, 190, 150, ROAD, 130),
    note("l-r3", "Public beta", COLORS.notePink, 420, 150, ROAD, 130),
    note("l-r4", "AI agent v1", COLORS.notePink, 570, 150, ROAD, 130),
    note("l-r5", "Integrations", COLORS.noteGreen, 800, 150, ROAD, 130),
    note("l-r6", "Enterprise SSO", COLORS.noteGreen, 940, 150, ROAD, 120),
    text("l-road-tip", "Drag notes between quarters as plans change.", 40, 320, 420, 40, ROAD),

    // Goals: triangle + oval metrics and a hand-drawn rocket.
    shape("l-g1", "triangle", "Growth", COLORS.orange, 40, 60, 150, 130, GOALS),
    shape("l-g2", "oval", "10k teams", COLORS.blue, 220, 70, 170, 100, GOALS),
    shape("l-g3", "rectangle", "NPS 50+", COLORS.green, 40, 230, 150, 80, GOALS),
    shape("l-g4", "rectangle", "< 1 min to first board", COLORS.yellow, 220, 230, 170, 80, GOALS),
    // Rocket (drawn in a ~200×260 box at x 450, y 50 inside the frame).
    stroke("l-rocket-body", GOALS, 450, 50, [
      { x: 100, y: 0 }, { x: 140, y: 50 }, { x: 150, y: 110 }, { x: 145, y: 190 },
      { x: 55, y: 190 }, { x: 50, y: 110 }, { x: 60, y: 50 }, { x: 100, y: 0 },
    ], INK, "medium"),
    stroke("l-rocket-window", GOALS, 450, 50, ellipse(100, 95, 22, 22, 16), "#3B82F6", "medium"),
    stroke("l-rocket-fin-l", GOALS, 450, 50, [
      { x: 52, y: 140 }, { x: 15, y: 190 }, { x: 18, y: 215 }, { x: 55, y: 190 },
    ], RED, "medium"),
    stroke("l-rocket-fin-r", GOALS, 450, 50, [
      { x: 148, y: 140 }, { x: 185, y: 190 }, { x: 182, y: 215 }, { x: 145, y: 190 },
    ], RED, "medium"),
    stroke("l-rocket-flame", GOALS, 450, 50, [
      { x: 70, y: 195 }, { x: 80, y: 240 }, { x: 92, y: 215 }, { x: 100, y: 262 },
      { x: 108, y: 215 }, { x: 120, y: 240 }, { x: 130, y: 195 },
    ], "#F97316", "thick"),
    text("l-rocket-note", "Drawn by the AI agent ✨", 455, 340, 220, 36, GOALS),
  ],
  edges: [
    arrow("l-e1", "l-start", "right", "l-signup", "left"),
    arrow("l-e2", "l-signup", "right", "l-invited", "left"),
    arrow("l-e3", "l-invited", "top", "l-join", "left", "Yes"),
    arrow("l-e4", "l-invited", "bottom", "l-create", "left", "No"),
    arrow("l-e5", "l-join", "right", "l-open", "top"),
    arrow("l-e6", "l-create", "right", "l-open", "bottom"),
    arrow("l-e7", "l-g1", "right", "l-g2", "left"),
  ],
};
