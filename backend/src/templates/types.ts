// Board templates are expressed in the same shape React Flow uses on the client,
// so the client can seed a board's Storage directly without any transformation.

export type TemplateNodeType = "note" | "text" | "shape" | "frame" | "path";

export type TemplateShape = "rectangle" | "oval" | "rhombus" | "triangle" | "block-arrow";

// Connection points every node has (see NodeHandles on the client).
export type TemplateHandle = "top" | "right" | "bottom" | "left";

export type TemplateNode = {
  id: string;
  type: TemplateNodeType;
  // Relative to the parent frame when `parentId` is set.
  position: { x: number; y: number };
  data: {
    label: string;
    color?: string;
    shape?: TemplateShape;
    // Pen strokes ("path" nodes): points relative to the node, like the Draw tool.
    points?: { x: number; y: number }[];
    size?: "thin" | "medium" | "thick";
    mode?: "pen" | "highlighter";
  };
  width?: number;
  height?: number;
  // Frame this node sits in; frames must come before their children.
  parentId?: string;
  // "parent" keeps the node inside its frame (it can't be dragged out).
  extent?: "parent";
  zIndex?: number;
};

export type TemplateEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: TemplateHandle;
  targetHandle?: TemplateHandle;
  // "smoothstep" draws elbow (right-angle) arrows.
  type?: "default" | "smoothstep";
  label?: string;
};

export type BoardTemplateContent = {
  nodes: TemplateNode[];
  edges: TemplateEdge[];
};
