import { randomUUID } from "node:crypto";

import { LiveMap, LiveObject } from "@liveblocks/node";
import { tool } from "ai";
import { z } from "zod";

import { getLiveblocks } from "../config/liveblocks.config";

const AI_USER_ID = "ai-agent";
const AI_USER_INFO = { name: "AI Agent", avatar: "", color: "#FFD21F" };

// Matches @liveblocks/react-flow's internal sync config (see its shared.js) so the
// nodes/edges we write here render identically to ones written by the client.
const NODE_SYNC_CONFIG = {
  selected: false,
  dragging: false,
  measured: false,
  resizing: false,
  position: "atomic",
  sourcePosition: "atomic",
  targetPosition: "atomic",
  extent: "atomic",
  origin: "atomic",
  handles: "atomic",
};

const EDGE_SYNC_CONFIG = {
  selected: false,
  markerStart: "atomic",
  markerEnd: "atomic",
  label: "atomic",
  labelBgPadding: "atomic",
};

const NOTE_COLORS = ["#FFF59D", "#FFCCF0", "#B3CEFF", "#BBA8FF", "#D2EFA1", "#FFB067"];
const NOTE_COLOR_NAMES = ["yellow", "pink", "blue", "purple", "green", "orange"] as const;
const NOTE_COLOR_MAP = Object.fromEntries(
  NOTE_COLOR_NAMES.map((name, index) => [name, NOTE_COLORS[index]]),
) as Record<(typeof NOTE_COLOR_NAMES)[number], string>;

const SHAPE_COLORS = ["#93C5FD", "#FDE047", "#B8A4FF", "#FFA94D", "#F9A8D4", "#86EFAC"];
const ROADMAP_COLORS = ["#93C5FD", "#F9A8D4", "#86EFAC"];
const ROADMAP_COLOR_NAMES = ["blue", "pink", "green"] as const;
const ROADMAP_COLOR_MAP = Object.fromEntries(
  ROADMAP_COLOR_NAMES.map((name, index) => [name, ROADMAP_COLORS[index]]),
) as Record<(typeof ROADMAP_COLOR_NAMES)[number], string>;

type BoardNode = {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
  width?: number;
  height?: number;
  parentId?: string;
  zIndex?: number;
  extent?: string;
};

type BoardEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
  label?: string;
};

type BoardState = { nodes: BoardNode[]; edges: BoardEdge[] };

// Loose shapes for the storage tree inside `mutateStorage`, where the root is
// typed against the backend's default storage type rather than this app's.
type LooseObject = { get(key: string): unknown; set(key: string, value: unknown): void };
type LooseMap = {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
  delete(key: string): void;
};

async function readBoard(roomId: string): Promise<BoardState> {
  const liveblocks = getLiveblocks();
  try {
    const storage = (await liveblocks.getStorageDocument(roomId, "json")) as {
      flow?: { nodes?: Record<string, BoardNode>; edges?: Record<string, BoardEdge> };
    };
    const flow = storage.flow;
    return {
      nodes: flow?.nodes ? Object.values(flow.nodes) : [],
      edges: flow?.edges ? Object.values(flow.edges) : [],
    };
  } catch {
    return { nodes: [], edges: [] };
  }
}

async function writeBoard(roomId: string, nodes: BoardNode[], edges: BoardEdge[]): Promise<void> {
  const liveblocks = getLiveblocks();
  await liveblocks.mutateStorage(roomId, ({ root }) => {
    const storage = root as unknown as LooseObject;

    let flow = storage.get("flow") as LooseObject | null;
    if (!flow) {
      flow = new LiveObject() as unknown as LooseObject;
      storage.set("flow", flow);
    }

    let nodesMap = flow.get("nodes") as LooseMap | null;
    if (!nodesMap) {
      nodesMap = new LiveMap() as unknown as LooseMap;
      flow.set("nodes", nodesMap);
    }

    let edgesMap = flow.get("edges") as LooseMap | null;
    if (!edgesMap) {
      edgesMap = new LiveMap() as unknown as LooseMap;
      flow.set("edges", edgesMap);
    }

    for (const node of nodes) {
      nodesMap.set(node.id, LiveObject.from(node as never, NODE_SYNC_CONFIG as never));
    }
    for (const edge of edges) {
      edgesMap.set(edge.id, LiveObject.from(edge as never, EDGE_SYNC_CONFIG as never));
    }
  });
}

type Point = { x: number; y: number };

// The agent appears on the board like a person (see Liveblocks' "agentic users"
// use case): its presence carries a cursor (canvas coordinates, the key React Flow's
// <Cursors> reads) and a status line ("Drawing a house…"). Presence is ephemeral;
// the TTL makes it disappear on its own if the process stops.
function setAgentPresence(
  roomId: string,
  presence: { cursor: Point | null; status: string | null },
  ttl: number,
) {
  return getLiveblocks()
    .setPresence(roomId, {
      userId: AI_USER_ID,
      data: { cursor: presence.cursor, promptingFeedId: null, aiStatus: presence.status },
      userInfo: AI_USER_INFO,
      ttl,
    })
    .catch(() => {});
}

// Runs a board change as the agent: save a restore point, show the agent (with a
// status) on the board, do the work, then show "Done" briefly and fade out.
async function asAgent<T>(
  roomId: string,
  status: string,
  focus: Point | null,
  work: (moveCursor: (to: Point) => Promise<void>) => Promise<T>,
): Promise<T> {
  await getLiveblocks().createVersionHistorySnapshot(roomId).catch(() => {});
  let cursor = focus;
  await setAgentPresence(roomId, { cursor, status }, 60);
  const moveCursor = async (to: Point) => {
    cursor = to;
    await setAgentPresence(roomId, { cursor, status }, 60);
  };
  try {
    return await work(moveCursor);
  } finally {
    await setAgentPresence(roomId, { cursor, status: "Done" }, 3);
  }
}

// Centre of the new top-level items, so the agent's cursor sits where it worked.
function centerOf(nodes: BoardNode[]): Point | null {
  const top = nodes.filter((node) => !node.parentId);
  if (!top.length) return null;
  const xs = top.flatMap((n) => [n.position.x, n.position.x + (n.width ?? 160)]);
  const ys = top.flatMap((n) => [n.position.y, n.position.y + (n.height ?? 160)]);
  return {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
  };
}

// Every mutating tool: restore point → agent present with a status → write → fade.
async function mutateBoard(
  roomId: string,
  nodes: BoardNode[],
  edges: BoardEdge[],
  status = "Updating the board…",
): Promise<void> {
  await asAgent(roomId, status, centerOf(nodes), () => writeBoard(roomId, nodes, edges));
}

async function removeFromBoard(roomId: string, nodeIds: string[], edgeIds: string[]) {
  await getLiveblocks().mutateStorage(roomId, ({ root }) => {
    const flow = (root as unknown as LooseObject).get("flow") as LooseObject | null;
    if (!flow) return;
    const nodesMap = flow.get("nodes") as LooseMap | null;
    const edgesMap = flow.get("edges") as LooseMap | null;
    for (const id of nodeIds) nodesMap?.delete(id);
    for (const id of edgeIds) edgesMap?.delete(id);
  });
}

// Absolute canvas position (children of a frame store positions relative to it).
function absolutePosition(node: BoardNode, byId: Map<string, BoardNode>): Point {
  const parent = node.parentId ? byId.get(node.parentId) : undefined;
  return parent
    ? { x: parent.position.x + node.position.x, y: parent.position.y + node.position.y }
    : node.position;
}

// Picks connection points so an arrow leaves the side facing its target.
function handlesBetween(from: BoardNode, to: BoardNode, byId: Map<string, BoardNode>) {
  const a = absolutePosition(from, byId);
  const b = absolutePosition(to, byId);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0
      ? { sourceHandle: "right", targetHandle: "left" }
      : { sourceHandle: "left", targetHandle: "right" };
  }
  return dy >= 0
    ? { sourceHandle: "bottom", targetHandle: "top" }
    : { sourceHandle: "top", targetHandle: "bottom" };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Colours the agent can ask for by name.
const COLOR_NAMES = ["yellow", "pink", "blue", "purple", "green", "orange", "red", "black", "white", "gray"] as const;
const SHAPE_FILL: Record<(typeof COLOR_NAMES)[number], string> = {
  yellow: "#FDE047",
  pink: "#F9A8D4",
  blue: "#93C5FD",
  purple: "#B8A4FF",
  green: "#86EFAC",
  orange: "#FFA94D",
  red: "#FCA5A5",
  black: "#1F1F1F",
  white: "#FFFFFF",
  gray: "#E5E7EB",
};
const STROKE: Record<(typeof COLOR_NAMES)[number], string> = {
  yellow: "#EAB308",
  pink: "#EC4899",
  blue: "#3B82F6",
  purple: "#8B5CF6",
  green: "#10B981",
  orange: "#F97316",
  red: "#EF4444",
  black: "#1F1F1F",
  white: "#FFFFFF",
  gray: "#6B7280",
};
const colorSchema = z.enum(COLOR_NAMES);

function nextOrigin(nodes: BoardNode[]): { x: number; y: number } {
  if (!nodes.length) return { x: 0, y: 0 };
  const maxY = nodes.reduce((max, node) => Math.max(max, node.position.y + (node.height ?? 160)), 0);
  return { x: 0, y: maxY + 100 };
}

function gridPositions(
  count: number,
  columns: number,
  origin: { x: number; y: number },
  gapX: number,
  gapY: number,
): { x: number; y: number }[] {
  return Array.from({ length: count }, (_, index) => ({
    x: origin.x + (index % columns) * gapX,
    y: origin.y + Math.floor(index / columns) * gapY,
  }));
}

const noteColorSchema = z.enum(NOTE_COLOR_NAMES).optional().describe("Optional note colour.");

/**
 * The AI agent's board tools. Each mutating tool writes into the room's React Flow
 * Storage (`flow.nodes` / `flow.edges`) using the same shape the client uses.
 */
export function buildBoardTools(roomId: string) {
  return {
    createStickyNotes: tool({
      description:
        "Add sticky notes to the board. Use this when the user asks for ideas, " +
        "notes, or items to be captured on the canvas.",
      inputSchema: z.object({
        notes: z
          .array(
            z.object({
              text: z.string().describe("The note text."),
              color: noteColorSchema,
            }),
          )
          .describe("The sticky notes to add."),
      }),
      execute: async ({ notes }) => {
        const { nodes } = await readBoard(roomId);
        const positions = gridPositions(notes.length, 4, nextOrigin(nodes), 190, 190);
        const newNodes: BoardNode[] = notes.map((note, index) => ({
          id: randomUUID(),
          type: "note",
          position: positions[index],
          width: 168,
          height: 168,
          data: {
            label: note.text,
            color: note.color ? NOTE_COLOR_MAP[note.color] : NOTE_COLORS[index % NOTE_COLORS.length],
          },
        }));
        await mutateBoard(roomId, newNodes, []);
        return `Added ${newNodes.length} sticky note${newNodes.length === 1 ? "" : "s"}.`;
      },
    }),

    createFlowchart: tool({
      description:
        "Create a flowchart on the board. Provide the steps in order (each with a label " +
        "and an optional shape) and the connections between them, referenced by step index.",
      inputSchema: z.object({
        steps: z
          .array(
            z.object({
              label: z.string(),
              shape: z.enum(["rectangle", "rhombus"]).optional(),
            }),
          )
          .describe("The flowchart steps, in order."),
        edges: z
          .array(
            z.object({
              from: z.number().int().min(0).describe("Source step index."),
              to: z.number().int().min(0).describe("Target step index."),
              label: z.string().optional().describe("Optional arrow label (e.g. Yes/No)."),
            }),
          )
          .optional()
          .describe("Connections between steps. Omit to connect each step to the next."),
      }),
      execute: async ({ steps, edges: connections }) => {
        const { nodes: existing } = await readBoard(roomId);
        const origin = nextOrigin(existing);

        const ids = steps.map(() => randomUUID());
        const nodes: BoardNode[] = steps.map((step, index) => {
          const shape = step.shape ?? "rectangle";
          const isRhombus = shape === "rhombus";
          return {
            id: ids[index],
            type: "shape",
            position: { x: origin.x + 40, y: origin.y + index * 150 },
            width: isRhombus ? 140 : 180,
            height: isRhombus ? 120 : 80,
            data: { label: step.label, shape, color: SHAPE_COLORS[index % SHAPE_COLORS.length] },
          };
        });

        const links: { from: number; to: number; label?: string }[] =
          connections ?? steps.slice(0, -1).map((_, index) => ({ from: index, to: index + 1 }));
        const edges: BoardEdge[] = links
          .filter((link) => ids[link.from] && ids[link.to])
          .map((link) => ({
            id: randomUUID(),
            source: ids[link.from],
            target: ids[link.to],
            sourceHandle: "bottom",
            targetHandle: "top",
            type: "smoothstep",
            ...(link.label ? { label: link.label } : {}),
          }));

        await mutateBoard(roomId, nodes, edges);
        return `Created a flowchart with ${nodes.length} step${nodes.length === 1 ? "" : "s"} and ${edges.length} connection${edges.length === 1 ? "" : "s"}.`;
      },
    }),

    createRoadmap: tool({
      description:
        "Create a roadmap on the board. Each phase becomes a titled frame (Q1, Q2, …) " +
        "containing sticky notes for its items.",
      inputSchema: z.object({
        phases: z
          .array(
            z.object({
              title: z.string(),
              color: z.enum(ROADMAP_COLOR_NAMES).optional(),
              items: z.array(z.string()),
            }),
          )
          .describe("The roadmap phases."),
      }),
      execute: async ({ phases }) => {
        const { nodes: existing } = await readBoard(roomId);
        const origin = nextOrigin(existing);
        const frameWidth = 300;
        const frameHeight = 440;
        const gap = 48;

        const nodes: BoardNode[] = [];
        phases.forEach((phase, phaseIndex) => {
          const frameId = randomUUID();
          nodes.push({
            id: frameId,
            type: "frame",
            position: { x: origin.x + phaseIndex * (frameWidth + gap), y: origin.y },
            width: frameWidth,
            height: frameHeight,
            zIndex: -1,
            data: {
              label: phase.title,
              color: phase.color ? ROADMAP_COLOR_MAP[phase.color] : ROADMAP_COLORS[phaseIndex % 3],
            },
          });

          phase.items.forEach((item, itemIndex) => {
            nodes.push({
              id: randomUUID(),
              type: "note",
              parentId: frameId,
              position: {
                x: 24 + (itemIndex % 2) * 150,
                y: 24 + Math.floor(itemIndex / 2) * 150,
              },
              width: 136,
              height: 136,
              data: { label: item, color: NOTE_COLORS[itemIndex % NOTE_COLORS.length] },
            });
          });
        });

        await mutateBoard(roomId, nodes, []);
        return `Created a roadmap with ${phases.length} phase${phases.length === 1 ? "" : "s"}.`;
      },
    }),

    summarizeSelection: tool({
      description:
        "Read the current board content so you can summarise it. Returns each node's type " +
        "and label; use it when the user asks you to summarise what's on the board.",
      inputSchema: z.object({}),
      execute: async () => {
        const { nodes } = await readBoard(roomId);
        const lines = nodes.map((node) => {
          const label = typeof node.data?.label === "string" ? node.data.label : "";
          return `- [${node.type}] ${label || "(untitled)"}`;
        });
        return lines.length ? lines.join("\n") : "The board is empty.";
      },
    }),

    organizeLayout: tool({
      description:
        "Tidy the board by arranging its top-level nodes into a neat grid. Use it when the " +
        "user asks to clean up or tidy the layout.",
      inputSchema: z.object({}),
      execute: async () => {
        const { nodes } = await readBoard(roomId);
        const topLevel = nodes.filter((node) => !node.parentId);
        if (!topLevel.length) return "The board is empty; nothing to arrange.";

        const columns = 4;
        const repositioned = topLevel.map((node, index) => ({
          ...node,
          position: {
            x: (index % columns) * 220,
            y: Math.floor(index / columns) * 190,
          },
        }));

        await mutateBoard(roomId, repositioned, []);
        return `Rearranged ${repositioned.length} node${repositioned.length === 1 ? "" : "s"}.`;
      },
    }),

    // ---------------------------------------------------------------- reading

    listBoardItems: tool({
      description:
        "List every item on the board with its id, type, text, position, size and parent " +
        "frame. Call this first when you need to move, connect, update, delete or put " +
        "existing items into a frame, so you know their ids and where they are.",
      inputSchema: z.object({}),
      execute: async () => {
        const { nodes, edges } = await readBoard(roomId);
        if (!nodes.length) return "The board is empty.";
        const items = nodes.map((node) => ({
          id: node.id,
          type: node.type,
          text: typeof node.data?.label === "string" ? node.data.label : "",
          x: Math.round(node.position.x),
          y: Math.round(node.position.y),
          width: node.width,
          height: node.height,
          ...(node.parentId ? { frameId: node.parentId } : {}),
        }));
        const links = edges.map((edge) => ({ from: edge.source, to: edge.target, label: edge.label }));
        return JSON.stringify({ items, connections: links });
      },
    }),

    // ---------------------------------------------------------------- adding

    addShapes: tool({
      description:
        "Add shapes (rectangle, oval, rhombus, triangle) with optional text. Give x/y to place " +
        "them precisely (canvas coordinates, top-left), or omit to place them below the board.",
      inputSchema: z.object({
        shapes: z.array(
          z.object({
            shape: z.enum(["rectangle", "oval", "rhombus", "triangle"]),
            text: z.string().optional(),
            color: colorSchema.optional(),
            x: z.number().optional(),
            y: z.number().optional(),
            width: z.number().min(24).max(1200).optional(),
            height: z.number().min(24).max(1200).optional(),
          }),
        ).min(1).max(50),
      }),
      execute: async ({ shapes }) => {
        const { nodes } = await readBoard(roomId);
        const grid = gridPositions(shapes.length, 4, nextOrigin(nodes), 220, 160);
        const newNodes: BoardNode[] = shapes.map((shape, index) => ({
          id: randomUUID(),
          type: "shape",
          position: { x: shape.x ?? grid[index].x, y: shape.y ?? grid[index].y },
          width: shape.width ?? (shape.shape === "rhombus" ? 140 : 180),
          height: shape.height ?? (shape.shape === "rhombus" ? 140 : 100),
          data: {
            label: shape.text ?? "",
            shape: shape.shape,
            color: SHAPE_FILL[shape.color ?? "blue"],
          },
        }));
        await mutateBoard(roomId, newNodes, [], `Adding ${newNodes.length} shape${newNodes.length === 1 ? "" : "s"}…`);
        return JSON.stringify({ added: newNodes.map((n) => ({ id: n.id, x: n.position.x, y: n.position.y })) });
      },
    }),

    addText: tool({
      description: "Add plain text labels (titles, captions) to the board, optionally at x/y.",
      inputSchema: z.object({
        texts: z.array(
          z.object({ text: z.string(), x: z.number().optional(), y: z.number().optional() }),
        ).min(1).max(30),
      }),
      execute: async ({ texts }) => {
        const { nodes } = await readBoard(roomId);
        const grid = gridPositions(texts.length, 1, nextOrigin(nodes), 0, 60);
        const newNodes: BoardNode[] = texts.map((item, index) => ({
          id: randomUUID(),
          type: "text",
          position: { x: item.x ?? grid[index].x, y: item.y ?? grid[index].y },
          width: Math.min(600, Math.max(120, item.text.length * 10)),
          height: 44,
          data: { label: item.text },
        }));
        await mutateBoard(roomId, newNodes, [], "Adding text…");
        return JSON.stringify({ added: newNodes.map((n) => n.id) });
      },
    }),

    drawPicture: tool({
      description:
        "Draw a simple line drawing (e.g. a flower, house, sun, tree, cat) as pen strokes. " +
        "Design it in a 300×300 box where (0,0) is top-left: each stroke is a list of [x, y] " +
        "points joined in order (close a shape by repeating its first point). Use 3-30 strokes " +
        "with enough points for smooth curves (circles need ~16 points). The drawing appears " +
        "stroke by stroke, placed inside a frame titled with its name.",
      inputSchema: z.object({
        title: z.string().describe("What it is, e.g. 'House'. Used as the frame title."),
        strokes: z.array(
          z.object({
            points: z.array(z.tuple([z.number(), z.number()])).min(2).max(200),
            color: colorSchema.optional(),
            thickness: z.enum(["thin", "medium", "thick"]).optional(),
          }),
        ).min(1).max(40),
        x: z.number().optional().describe("Where to place the drawing (top-left). Optional."),
        y: z.number().optional(),
        scale: z.number().min(0.3).max(4).optional().describe("Size multiplier, default 1."),
      }),
      execute: async ({ title, strokes, x, y, scale = 1 }) => {
        const { nodes } = await readBoard(roomId);
        const origin = x !== undefined && y !== undefined ? { x, y } : nextOrigin(nodes);
        const padding = 30;

        const frameId = randomUUID();
        const frame: BoardNode = {
          id: frameId,
          type: "frame",
          position: origin,
          width: 300 * scale + padding * 2,
          height: 300 * scale + padding * 2,
          zIndex: -1,
          data: { label: title, color: "#FFFFFF" },
        };

        // One path node per stroke; points are stored relative to the stroke's box,
        // exactly like strokes drawn by hand with the Draw tool.
        const paths: BoardNode[] = strokes.map((stroke) => {
          const pts = stroke.points.map(([px, py]) => ({ x: px * scale, y: py * scale }));
          const minX = Math.min(...pts.map((pt) => pt.x));
          const minY = Math.min(...pts.map((pt) => pt.y));
          const maxX = Math.max(...pts.map((pt) => pt.x));
          const maxY = Math.max(...pts.map((pt) => pt.y));
          return {
            id: randomUUID(),
            type: "path",
            parentId: frameId,
            position: { x: padding + minX, y: padding + minY },
            width: Math.max(8, maxX - minX),
            height: Math.max(8, maxY - minY),
            data: {
              label: "",
              points: pts.map((pt) => ({ x: pt.x - minX, y: pt.y - minY })),
              color: STROKE[stroke.color ?? "black"],
              size: stroke.thickness ?? "medium",
              mode: "pen",
            },
          };
        });

        // Draw live: frame first, then each stroke with the agent's cursor on it.
        await asAgent(
          roomId,
          `Drawing ${title.toLowerCase().startsWith("a ") ? title : `a ${title.toLowerCase()}`}…`,
          { x: origin.x + padding, y: origin.y + padding },
          async (moveCursor) => {
            await writeBoard(roomId, [frame], []);
            for (const path of paths) {
              await moveCursor({
                x: origin.x + path.position.x,
                y: origin.y + path.position.y,
              });
              await writeBoard(roomId, [path], []);
              await sleep(120);
            }
          },
        );
        return `Drew "${title}" with ${paths.length} stroke${paths.length === 1 ? "" : "s"} (frame id ${frameId}).`;
      },
    }),

    addFrame: tool({
      description:
        "Add a frame (a titled area that groups items; moving the frame moves everything in " +
        "it). Optionally pass itemIds of existing items to put inside it — the frame is then " +
        "sized to fit them unless you give x/y/width/height.",
      inputSchema: z.object({
        title: z.string(),
        color: z.enum(["white", "yellow", "blue", "green", "pink", "purple", "transparent"]).optional(),
        itemIds: z.array(z.string()).optional(),
        x: z.number().optional(),
        y: z.number().optional(),
        width: z.number().min(120).max(4000).optional(),
        height: z.number().min(120).max(4000).optional(),
      }),
      execute: async ({ title, color, itemIds = [], x, y, width, height }) => {
        const { nodes } = await readBoard(roomId);
        const byId = new Map(nodes.map((node) => [node.id, node]));
        const items = itemIds.map((id) => byId.get(id)).filter((n): n is BoardNode => !!n && n.type !== "frame");

        const padding = 40;
        let box = { x: x ?? 0, y: y ?? 0, width: width ?? 480, height: height ?? 360 };
        if (items.length && (x === undefined || width === undefined)) {
          const abs = items.map((item) => ({ item, pos: absolutePosition(item, byId) }));
          const minX = Math.min(...abs.map((a) => a.pos.x));
          const minY = Math.min(...abs.map((a) => a.pos.y));
          const maxX = Math.max(...abs.map((a) => a.pos.x + (a.item.width ?? 160)));
          const maxY = Math.max(...abs.map((a) => a.pos.y + (a.item.height ?? 160)));
          box = { x: minX - padding, y: minY - padding, width: maxX - minX + padding * 2, height: maxY - minY + padding * 2 };
        } else if (x === undefined) {
          box = { ...box, ...nextOrigin(nodes) };
        }

        const fills: Record<string, string> = {
          white: "#FFFFFF", yellow: "#FEF9C3", blue: "#DBEAFE", green: "#DCFCE7",
          pink: "#FCE7F3", purple: "#EDE9FE", transparent: "transparent",
        };
        const frameId = randomUUID();
        const frame: BoardNode = {
          id: frameId,
          type: "frame",
          position: { x: box.x, y: box.y },
          width: box.width,
          height: box.height,
          zIndex: -1,
          data: { label: title, color: fills[color ?? "white"] },
        };
        const moved = items.map((item) => {
          const pos = absolutePosition(item, byId);
          return { ...item, parentId: frameId, position: { x: pos.x - box.x, y: pos.y - box.y } };
        });

        await mutateBoard(roomId, [frame, ...moved], [], `Adding frame "${title}"…`);
        return JSON.stringify({ frameId, itemsInside: moved.length });
      },
    }),

    // ---------------------------------------------------------------- changing

    moveIntoFrame: tool({
      description:
        "Put existing items inside an existing frame (they keep their place on screen and " +
        "then move with the frame). Use listBoardItems to get the ids.",
      inputSchema: z.object({ frameId: z.string(), itemIds: z.array(z.string()).min(1) }),
      execute: async ({ frameId, itemIds }) => {
        const { nodes } = await readBoard(roomId);
        const byId = new Map(nodes.map((node) => [node.id, node]));
        const frame = byId.get(frameId);
        if (!frame || frame.type !== "frame") return "That frame doesn't exist.";
        const framePos = absolutePosition(frame, byId);
        const moved = itemIds
          .map((id) => byId.get(id))
          .filter((n): n is BoardNode => !!n && n.id !== frameId && n.type !== "frame")
          .map((item) => {
            const pos = absolutePosition(item, byId);
            return { ...item, parentId: frameId, position: { x: pos.x - framePos.x, y: pos.y - framePos.y } };
          });
        if (!moved.length) return "None of those items exist.";
        await mutateBoard(roomId, moved, [], "Moving items into the frame…");
        return `Moved ${moved.length} item${moved.length === 1 ? "" : "s"} into the frame.`;
      },
    }),

    moveItems: tool({
      description: "Move items to new positions (canvas coordinates, top-left of each item).",
      inputSchema: z.object({
        moves: z.array(z.object({ id: z.string(), x: z.number(), y: z.number() })).min(1),
      }),
      execute: async ({ moves }) => {
        const { nodes } = await readBoard(roomId);
        const byId = new Map(nodes.map((node) => [node.id, node]));
        const moved = moves
          .map((move) => {
            const node = byId.get(move.id);
            if (!node) return null;
            const parent = node.parentId ? byId.get(node.parentId) : undefined;
            const offset = parent ? absolutePosition(parent, byId) : { x: 0, y: 0 };
            return { ...node, position: { x: move.x - offset.x, y: move.y - offset.y } };
          })
          .filter((n): n is BoardNode => !!n);
        if (!moved.length) return "None of those items exist.";
        await mutateBoard(roomId, moved, [], "Moving items…");
        return `Moved ${moved.length} item${moved.length === 1 ? "" : "s"}.`;
      },
    }),

    connectItems: tool({
      description:
        "Draw arrows between existing items (by id). The arrow leaves the side facing its " +
        "target. Add a label for decisions (e.g. Yes/No).",
      inputSchema: z.object({
        connections: z.array(
          z.object({ from: z.string(), to: z.string(), label: z.string().optional() }),
        ).min(1),
      }),
      execute: async ({ connections }) => {
        const { nodes } = await readBoard(roomId);
        const byId = new Map(nodes.map((node) => [node.id, node]));
        const edges: BoardEdge[] = connections
          .filter((c) => byId.has(c.from) && byId.has(c.to))
          .map((c) => ({
            id: randomUUID(),
            source: c.from,
            target: c.to,
            type: "smoothstep",
            ...handlesBetween(byId.get(c.from)!, byId.get(c.to)!, byId),
            ...(c.label ? { label: c.label } : {}),
          }));
        if (!edges.length) return "None of those items exist.";
        await asAgent(roomId, "Connecting items…", null, () => writeBoard(roomId, [], edges));
        return `Added ${edges.length} arrow${edges.length === 1 ? "" : "s"}.`;
      },
    }),

    updateItems: tool({
      description: "Change the text and/or colour of existing items (by id).",
      inputSchema: z.object({
        updates: z.array(
          z.object({ id: z.string(), text: z.string().optional(), color: colorSchema.optional() }),
        ).min(1),
      }),
      execute: async ({ updates }) => {
        const { nodes } = await readBoard(roomId);
        const byId = new Map(nodes.map((node) => [node.id, node]));
        const changed = updates
          .map((update) => {
            const node = byId.get(update.id);
            if (!node) return null;
            const palette = node.type === "path" ? STROKE : SHAPE_FILL;
            return {
              ...node,
              data: {
                ...node.data,
                ...(update.text !== undefined ? { label: update.text } : {}),
                ...(update.color ? { color: palette[update.color] } : {}),
              },
            };
          })
          .filter((n): n is BoardNode => !!n);
        if (!changed.length) return "None of those items exist.";
        await mutateBoard(roomId, changed, [], "Updating items…");
        return `Updated ${changed.length} item${changed.length === 1 ? "" : "s"}.`;
      },
    }),

    deleteItems: tool({
      description:
        "Delete items (by id) and any arrows attached to them. Deleting a frame also " +
        "deletes the items inside it. Only delete when the user clearly asks to.",
      inputSchema: z.object({ ids: z.array(z.string()).min(1) }),
      execute: async ({ ids }) => {
        const { nodes, edges } = await readBoard(roomId);
        const doomed = new Set(ids.filter((id) => nodes.some((n) => n.id === id)));
        for (const node of nodes) if (node.parentId && doomed.has(node.parentId)) doomed.add(node.id);
        if (!doomed.size) return "None of those items exist.";
        const edgeIds = edges.filter((e) => doomed.has(e.source) || doomed.has(e.target)).map((e) => e.id);
        await asAgent(roomId, "Deleting items…", null, () => removeFromBoard(roomId, [...doomed], edgeIds));
        return `Deleted ${doomed.size} item${doomed.size === 1 ? "" : "s"}.`;
      },
    }),
  };
}

export type BoardTools = ReturnType<typeof buildBoardTools>;
