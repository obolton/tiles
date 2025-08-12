import { z } from "zod";
import { RichTextSchema } from "@/schema/RichText.ts";
import { ColorSchema } from "@/schema/Color.ts";
import { BackgroundSchema } from "@/schema/Background.ts";
import { VerticalAlignment } from "@prisma/client";

export const CreateTextSchema = z.object({
  pageId: z.uuid(),
  sectionId: z.uuid(),
  content: RichTextSchema.optional(),
  textColor: ColorSchema.nullable().optional(),
  background: BackgroundSchema.optional(),
  width: z.number().int().gte(1).lte(12).optional(),
  height: z.number().int().gte(1).lte(24).optional(),
  block: z.boolean().optional(),
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
