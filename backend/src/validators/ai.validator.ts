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
});

export const stopAiChatSchema = z.object({
  feedId: z.string().min(1).max(100),
});

export type AiChatInput = z.infer<typeof aiChatSchema>;
