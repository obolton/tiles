import { z } from "zod";
import { RichTextSchema } from "@/schema/RichText.ts";
import { Theme } from "@prisma/client";

export const CreateTextSchema = z.object({
  pageId: z.string().uuid(),
  collectionId: z.string().uuid().optional(),
  content: RichTextSchema.optional(),
  theme: z.nativeEnum(Theme).nullable().optional(),
  hue: z.number().gte(0).lte(360).nullable().optional(),
  columns: z.number().int().gte(1).lte(3).optional(),
  rows: z.number().int().gte(1).lte(3).optional(),
});
export type CreateTextSchema = z.infer<typeof CreateTextSchema>;

export const UpdateTextSchema = z.object({
  pageId: z.string().uuid(),
  id: z.string().uuid(),
  content: RichTextSchema.optional(),
  theme: z.nativeEnum(Theme).nullable().optional(),
  hue: z.number().gte(0).lte(360).nullable().optional(),
});
export type UpdateTextSchema = z.infer<typeof UpdateTextSchema>;
