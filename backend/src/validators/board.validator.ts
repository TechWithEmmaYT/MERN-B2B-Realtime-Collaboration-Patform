import { z } from "zod";

export const createBoardSchema = z.object({
  teamId: z.string().min(1, "Pick a team"),
  title: z.string().trim().max(80, "Keep the title under 80 characters").optional(),
  description: z.string().trim().max(200, "Keep it under 200 characters").optional(),
  templateKey: z.string().max(40).optional(),
});

export const listBoardsQuerySchema = z.object({
  teamId: z.string().min(1),
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>;
