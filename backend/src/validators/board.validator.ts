import { z } from "zod";

import { BOARD_TEMPLATE_KEYS } from "../templates";

export const createBoardSchema = z.object({
  teamId: z.string().min(1, "Pick a team"),
  title: z.string().trim().max(80, "Keep the title under 80 characters").optional(),
  description: z.string().trim().max(200, "Keep it under 200 characters").optional(),
  templateKey: z.enum(BOARD_TEMPLATE_KEYS).optional(),
});

export const boardTemplateParamsSchema = z.object({
  key: z.enum(BOARD_TEMPLATE_KEYS),
});

export const listBoardsQuerySchema = z.object({
  teamId: z.string().min(1),
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>;
