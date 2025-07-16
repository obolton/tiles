import { z } from "zod";
import { RichTextSchema } from "@/schema/RichText.ts";

export const CreateImageSchema = z.object({
  pageId: z.string().uuid(),
  sectionId: z.string().uuid(),
  imageKey: z.string(),
  text: RichTextSchema.nullable().optional(),
  theme: z.string().nullable().optional(),
});
export type CreateImageSchema = z.infer<typeof CreateImageSchema>;

export const UpdateImageSchema = z.object({
  pageId: z.string().uuid(),
  id: z.string().uuid(),
  text: RichTextSchema.nullable().optional(),
  origin: z
    .object({
      x: z.number().gte(0).lte(1),
      y: z.number().gte(0).lte(1),
    })
    .optional(),
  theme: z.string().nullable().optional(),
});
export type UpdateImageSchema = z.infer<typeof UpdateImageSchema>;
