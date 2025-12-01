import { z } from "zod";
import { ColorSchema } from "@/schema/Color";
import { Font } from "@/generated/prisma/client";

export const GetPageByIdSchema = z.object({
  id: z.uuid(),
});
export type GetPageByIdSchema = z.infer<typeof GetPageByIdSchema>;

export const ListPagesSchema = z.object({
  query: z.string().min(1).optional(),
  offset: z.int().gte(0).optional(), // TODO: Use cursors
});
export type ListPagesSchema = z.infer<typeof ListPagesSchema>;

export const CreatePageSchema = z.object({
  title: z.string().min(1),
});
export type CreatePageSchema = z.infer<typeof CreatePageSchema>;

export const UpdatePageSchema = z.object({
  pageId: z.uuid(),
  published: z.boolean().optional(),
  title: z.string().min(1).optional(),
  backgroundColor: ColorSchema.nullable().optional(),
  font: z.enum(Font).optional(),
  coverImageKey: z.string().nullable().optional(),
  folderId: z.uuid().nullable().optional(),
});
export type UpdatePageSchema = z.infer<typeof UpdatePageSchema>;

export const DeletePageSchema = z.object({
  pageId: z.uuid(),
});
export type DeletePageSchema = z.infer<typeof DeletePageSchema>;

export const RestorePageSchema = z.object({
  pageId: z.uuid(),
});
export type RestorePageSchema = z.infer<typeof RestorePageSchema>;
