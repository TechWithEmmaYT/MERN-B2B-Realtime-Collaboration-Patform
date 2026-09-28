import { brainstormTemplate } from "./brainstorm";
import { flowchartTemplate } from "./flowchart";
import { journeyTemplate } from "./journey";
import { launchTemplate } from "./launch";
import { roadmapTemplate } from "./roadmap";
import type { BoardTemplateContent } from "./types";

// The only template names allowed for a board. `blank` has no content.
export const BOARD_TEMPLATE_KEYS = [
  "blank",
  "brainstorm",
  "flowchart",
  "roadmap",
  "journey",
  "launch",
] as const;

export type BoardTemplateKey = (typeof BOARD_TEMPLATE_KEYS)[number];

const TEMPLATES: Record<string, BoardTemplateContent> = {
  brainstorm: brainstormTemplate,
  flowchart: flowchartTemplate,
  roadmap: roadmapTemplate,
  journey: journeyTemplate,
  launch: launchTemplate,
};

/** Returns the template's nodes + edges, or `null` for blank/unknown keys. */
export const getBoardTemplate = (key: string): BoardTemplateContent | null =>
  TEMPLATES[key] ?? null;
