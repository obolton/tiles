import { z } from "zod";
import { BODY_ID } from "doc/body";

/** A tile id, or the body of a document page. */
const TargetIdSchema = z.union([z.uuid(), z.literal(BODY_ID)]);

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
      tileIds: z.array(TargetIdSchema).max(10).optional(),
    })
    .optional(),
  selection: z
    .strictObject({
      tileId: TargetIdSchema,
      from: z.string().max(1024),
      to: z.string().max(1024),
    })
    .optional(),
  history: z.array(MessageSchema).max(50).optional(),
});
export type WriteSchema = z.infer<typeof WriteSchema>;
