import { z } from "zod";
import { TileSchema } from "@/schema/Tile";
import { RichTextSchema } from "@/schema/RichText.ts";
import { ColorSchema } from "@/schema/Color.ts";
import { BackgroundSchema } from "@/schema/Background.ts";
import { VerticalAlignment } from "@/generated/prisma/client";

export const CreateTextSchema = z.object({
  pageId: z.uuid(),
  sectionId: z.uuid(),
  ...TileSchema.shape,
  content: RichTextSchema.optional(),
  textColor: ColorSchema.nullable().optional(),
  background: BackgroundSchema.optional(),
  align: z.enum(VerticalAlignment).optional(),
});
export type CreateTextSchema = z.infer<typeof CreateTextSchema>;

export const UpdateTextSchema = z.object({
  pageId: z.uuid(),
  id: z.uuid(),
  content: RichTextSchema.optional(),
  textColor: ColorSchema.nullable().optional(),
  background: BackgroundSchema.optional(),
  align: z.enum(VerticalAlignment).optional(),
});
export type UpdateTextSchema = z.infer<typeof UpdateTextSchema>;
