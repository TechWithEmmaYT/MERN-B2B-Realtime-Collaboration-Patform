import type { BoardTemplateContent, TemplateEdge, TemplateNode } from "./types";

// Left-to-right flowchart inside a white frame (like Miro's): Start → Process →
// Process → Decision. "Yes" goes up to the purple path and ends; "No" runs the
// orange loop back to the second Process. Title and tips cards sit to the left.

const BLUE = "#93C5FD";
const YELLOW = "#FDE047";
const PURPLE = "#B8A4FF";
const ORANGE = "#FFA94D";
const BLACK = "#1F1F1F";

const BOX = { width: 180, height: 80 };
const FRAME = "f-frame";

// Box inside the frame (position relative to the frame).
const box = (id: string, label: string, color: string, x: number, y: number): TemplateNode => ({
  id,
  type: "shape",
  parentId: FRAME,
  position: { x, y },
  data: { label, shape: "rectangle", color },
  ...BOX,
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

export const flowchartTemplate: BoardTemplateContent = {
  nodes: [
    // Cards on the left (outside the frame).
    {
      id: "f-title",
      type: "shape",
      position: { x: 0, y: 0 },
      data: { label: "Flowchart\nCreate a flowchart with Kano", shape: "rectangle", color: YELLOW },
      width: 300,
      height: 120,
    },
    {
      id: "f-tips",
      type: "shape",
      position: { x: 0, y: 150 },
      data: {
        label:
          "Tips\nUse the AI prompt to create a flowchart, then iterate on it and style it as needed.",
        shape: "rectangle",
        color: "#F4F4F5",
      },
      width: 300,
      height: 140,
    },

    // The frame (must come before its children).
    {
      id: FRAME,
      type: "frame",
      position: { x: 360, y: 0 },
      data: { label: "Flowchart", color: "#FFFFFF" },
      width: 1440,
      height: 560,
      zIndex: -1,
    },

    // Main row.
    box("f-start", "Start", BLUE, 40, 240),
    box("f-p1", "Process", YELLOW, 280, 240),
    box("f-p2", "Process", YELLOW, 520, 240),
    {
      id: "f-decision",
      type: "shape",
      parentId: FRAME,
      position: { x: 770, y: 220 },
      data: { label: "Decision", shape: "rhombus", color: BLACK },
      width: 120,
      height: 120,
    },

    // Yes path (top).
    box("f-yes1", "Process", PURPLE, 980, 60),
    box("f-yes2", "Process", PURPLE, 1220, 60),
    box("f-end", "End", BLUE, 1220, 240),

    // No path (loop back).
    box("f-no1", "Process", ORANGE, 980, 240),
    box("f-no2", "Process", ORANGE, 980, 420),
    box("f-no3", "Process", ORANGE, 700, 420),

    // Sticky notes inside the frame.
    {
      id: "f-note1",
      type: "note",
      parentId: FRAME,
      position: { x: 40, y: 40 },
      data: { label: "Add password reset flow", color: "#FFF59D" },
      width: 150,
      height: 150,
    },
    {
      id: "f-note2",
      type: "note",
      parentId: FRAME,
      position: { x: 1250, y: 380 },
      data: { label: "Add social logins (Google, GitHub)", color: "#D2EFA1" },
      width: 150,
      height: 150,
    },
  ],
  edges: [
    arrow("f-e1", "f-start", "right", "f-p1", "left"),
    arrow("f-e2", "f-p1", "right", "f-p2", "left"),
    arrow("f-e3", "f-p2", "right", "f-decision", "left"),
    arrow("f-e4", "f-decision", "top", "f-yes1", "left", "Yes"),
    arrow("f-e5", "f-decision", "right", "f-no1", "left", "No"),
    arrow("f-e6", "f-yes1", "right", "f-yes2", "left"),
    arrow("f-e7", "f-yes2", "bottom", "f-end", "top"),
    arrow("f-e8", "f-no1", "bottom", "f-no2", "top"),
    arrow("f-e9", "f-no2", "left", "f-no3", "right"),
    arrow("f-e10", "f-no3", "left", "f-p2", "bottom"),
  ],
};
