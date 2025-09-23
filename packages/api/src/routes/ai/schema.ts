import { z } from "zod";

export const GenerateImageSchema = z.object({
  prompt: z.string().min(1).max(4096),
});
export type GenerateImageSchema = z.infer<typeof GenerateImageSchema>;

export const WriteSchema = z.object({
  pageId: z.uuid(),
  sectionId: z.uuid(),
  prompt: z.string().min(10).max(4096),
  context: z
    .strictObject({
      text: z.string().max(4096).optional(),
      tileIds: z.array(z.uuid()).max(10).optional(),
    })
    .optional(),
});
export type WriteSchema = z.infer<typeof WriteSchema>;
