import { z } from "zod";

export const aiChatSchema = z.object({
  feedId: z.string().min(1).max(100),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(20_000),
      }),
    )
    .max(100),
  // The canvas objects the user selected, so the agent can act on them.
  context: z.string().max(20_000).optional(),
});

export const stopAiChatSchema = z.object({
  feedId: z.string().min(1).max(100),
});

export type AiChatInput = z.infer<typeof aiChatSchema>;
