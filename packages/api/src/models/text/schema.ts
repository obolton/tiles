import { z } from "zod";
import { RichTextSchema } from "@/schema/RichText.ts";
import { Theme } from "@prisma/client";

export const CreateTextSchema = z.object({
  pageId: z.string().uuid(),
  content: RichTextSchema.optional(),
  theme: z.nativeEnum(Theme).optional(),
  hue: z.number().gte(0).lte(360).optional(),
});
export type CreateTextSchema = z.infer<typeof CreateTextSchema>;

export const UpdateTextSchema = z.object({
  id: z.string().uuid(),
  content: RichTextSchema.optional(),
  theme: z.nativeEnum(Theme).optional(),
  hue: z.number().gte(0).lte(360).optional(),
});
export type UpdateTextSchema = z.infer<typeof UpdateTextSchema>;
