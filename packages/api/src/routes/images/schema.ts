import { z } from "zod";
import { CreateTileSchema } from "@/schema/Tile";
import { RichTextSchema } from "@/schema/RichText.ts";

export const CreateImageSchema = z.strictObject({
  ...CreateTileSchema.shape,
  imageId: z.uuid(),
  alt: z.string().nullable().optional(),
  text: RichTextSchema.nullable().optional(),
});
export type CreateImageSchema = z.infer<typeof CreateImageSchema>;

export const UpdateImageSchema = z.strictObject({
  pageId: z.uuid(),
  id: z.uuid(),
  alt: z.string().nullable().optional(),
  text: RichTextSchema.nullable().optional(),
  origin: z
    .object({
      x: z.number().gte(0).lte(1),
      y: z.number().gte(0).lte(1),
    })
    .optional(),
});
export type UpdateImageSchema = z.infer<typeof UpdateImageSchema>;
