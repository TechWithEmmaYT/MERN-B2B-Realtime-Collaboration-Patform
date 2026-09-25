import { z } from "zod";

export const createTeamSchema = z.object({
  name: z.string().trim().min(2, "Team name must be at least 2 characters").max(40, "Keep it under 40 characters"),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
