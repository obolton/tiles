import { z } from "zod";
import { PaginationSchema, SortDirection } from "@/schema/Pagination";
import { PageType } from "@/generated/prisma/client";

export const GetPageByIdSchema = z.object({
  id: z.uuid(),
});
export type GetPageByIdSchema = z.infer<typeof GetPageByIdSchema>;

export const PageSortField = z.enum(["updatedAt", "createdAt", "title"]);
export type PageSortField = z.infer<typeof PageSortField>;

export const ListPagesSchema = PaginationSchema.extend({
  sortBy: PageSortField.optional(),
  sortDirection: SortDirection.optional(),
});
export type ListPagesSchema = z.infer<typeof ListPagesSchema>;

export const CreatePageSchema = z.object({
  title: z.string().min(1),
  type: z.enum(PageType).optional(),
});
export type CreatePageSchema = z.infer<typeof CreatePageSchema>;

export const UpdatePageSchema = z.object({
  pageId: z.uuid(),
  published: z.boolean().optional(),
  title: z.string().min(1).optional(),
  coverImageKey: z.string().nullable().optional(),
  folderId: z.uuid().nullable().optional(),
});
export type UpdatePageSchema = z.infer<typeof UpdatePageSchema>;

export const DeletePageSchema = z.object({
  pageIds: z.array(z.uuid()).min(1).max(100),
});
export type DeletePageSchema = z.infer<typeof DeletePageSchema>;

export const RestorePageSchema = z.object({
  pageIds: z.array(z.uuid()).min(1).max(100),
});
export type RestorePageSchema = z.infer<typeof RestorePageSchema>;

export const MovePagesSchema = z.object({
  pageIds: z.array(z.uuid()).min(1).max(100),
  folderId: z.uuid().nullable(),
});
export type MovePagesSchema = z.infer<typeof MovePagesSchema>;
