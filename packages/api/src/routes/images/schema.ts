import { z } from "zod";
import { PositionSchema } from "@/schema/Position.ts";
import { RichTextSchema } from "@/schema/RichText.ts";

export const CreateImageSchema = z.object({
  pageId: z.uuid(),
  sectionId: z.uuid(),
  ...PositionSchema.shape,
  imageKey: z.string(),
  text: RichTextSchema.nullable().optional(),
  theme: z.string().nullable().optional(),
});
export type CreateImageSchema = z.infer<typeof CreateImageSchema>;

export const UpdateImageSchema = z.object({
  pageId: z.uuid(),
  id: z.uuid(),
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
