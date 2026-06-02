import { z } from "zod";
import { CreateTileSchema } from "@/schema/Tile";
import { RichTextSchema } from "@/schema/RichText.ts";
import { VerticalAlignment } from "@/generated/prisma/client";

export const CreateTextSchema = z.strictObject({
  ...CreateTileSchema.shape,
  content: RichTextSchema.optional(),
  align: z.enum(VerticalAlignment).optional(),
});
export type CreateTextSchema = z.infer<typeof CreateTextSchema>;
