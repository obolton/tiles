import { z } from "zod";
import { RichTextSchema } from "@/schema/RichText.ts";
import { VerticalAlignment } from "@prisma/client";

export const CreateTextSchema = z.object({
  pageId: z.uuid(),
  sectionId: z.uuid(),
  content: RichTextSchema.optional(),
  color: z
    .object({
      l: z.number().gte(0).lte(1),
      c: z.number().gte(0).lte(0.4),
      h: z.number().gte(0).lte(360),
    })
    .optional(),
  imageKey: z.string().nullable().optional(),
  width: z.number().int().gte(1).lte(12).optional(),
  height: z.number().int().gte(1).lte(24).optional(),
  align: z.enum(VerticalAlignment).optional(),
});
export type CreateTextSchema = z.infer<typeof CreateTextSchema>;

export const UpdateTextSchema = z.object({
  pageId: z.uuid(),
  id: z.uuid(),
  content: RichTextSchema.optional(),
  color: z
    .object({
      l: z.number().gte(0).lte(1),
      c: z.number().gte(0).lte(0.4),
      h: z.number().gte(0).lte(360),
    })
    .nullable()
    .optional(),
  imageKey: z.string().nullable().optional(),
  align: z.enum(VerticalAlignment).optional(),
});
export type UpdateTextSchema = z.infer<typeof UpdateTextSchema>;
