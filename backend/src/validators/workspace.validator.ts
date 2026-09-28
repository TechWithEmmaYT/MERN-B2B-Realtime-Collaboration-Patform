import { z } from "zod";

import { WORKSPACE_ICON_COLORS, WORKSPACE_ICON_TYPES } from "../types/roles";

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes")
    .optional(),
  iconType: z.enum(WORKSPACE_ICON_TYPES).optional(),
  iconValue: z.string().max(200).optional(),
  iconColor: z.enum(WORKSPACE_ICON_COLORS).optional(),
});

export const slugQuerySchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes"),
});

export const inviteRowSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  role: z.enum(["admin", "member"]),
});

export const createInvitationsSchema = z.object({
  invites: z.array(inviteRowSchema).min(1).max(100),
  defaultRole: z.enum(["admin", "member"]).optional(),
});

export const updateWorkspaceSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(60, "Keep it under 60 characters").optional(),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes")
      .optional(),
    iconType: z.enum(WORKSPACE_ICON_TYPES).optional(),
    iconValue: z.string().max(200).optional(),
    iconColor: z.enum(WORKSPACE_ICON_COLORS).optional(),
  })
  .refine((value) => Object.values(value).some((v) => v !== undefined), {
    message: "Provide at least one field to update",
  });

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type CreateInvitationsInput = z.infer<typeof createInvitationsSchema>;
