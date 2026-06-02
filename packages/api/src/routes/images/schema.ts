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
