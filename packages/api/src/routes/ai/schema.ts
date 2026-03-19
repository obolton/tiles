import { z } from "zod";

export const GenerateImageSchema = z.object({
  prompt: z.string().min(1).max(4096),
});
export type GenerateImageSchema = z.infer<typeof GenerateImageSchema>;

const MessageSchema = z.discriminatedUnion("role", [
  z.object({ role: z.literal("user"), content: z.string().max(4096) }),
  z.object({ role: z.literal("assistant"), content: z.string().max(16384) }),
]);

export const WriteSchema = z.object({
  pageId: z.uuid(),
  sectionId: z.uuid().nullable(),
  prompt: z.string().min(10).max(4096),
  context: z
    .strictObject({
      text: z.string().max(4096).optional(),
      tileIds: z.array(z.uuid()).max(10).optional(),
    })
    .optional(),
  history: z.array(MessageSchema).max(50).optional(),
});
export type WriteSchema = z.infer<typeof WriteSchema>;
