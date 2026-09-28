import { z } from "zod";

export const createTeamSchema = z.object({
  name: z.string().trim().min(2, "Team name must be at least 2 characters").max(40, "Keep it under 40 characters"),
});

export const addTeamMembersSchema = z.object({
  userIds: z.array(z.string()).min(1).max(100),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type AddTeamMembersInput = z.infer<typeof addTeamMembersSchema>;