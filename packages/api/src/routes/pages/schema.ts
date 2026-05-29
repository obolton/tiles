import { z } from "zod";
import { PaginationSchema, SortDirection } from "@/schema/Pagination";
import { HorizontalAlignment, PageType } from "@/generated/prisma/client";
import { FontIdSchema } from "@/config/fonts";

export const MIN_WIDTH = 12;
export const MAX_WIDTH = 80;

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

const MIN_DOCK_SIZE = 100;
const MAX_DOCK_SIZE = 1000;

export const UpdatePageSchema = z.object({
  pageId: z.uuid(),
  published: z.boolean().optional(),
  title: z.string().min(1).optional(),
  font: FontIdSchema.optional(),
  coverImageKey: z.string().nullable().optional(),
  folderId: z.uuid().nullable().optional(),
  dockTopHeight: z.number().gte(MIN_DOCK_SIZE).lte(MAX_DOCK_SIZE).optional(),
  dockBottomHeight: z.number().gte(MIN_DOCK_SIZE).lte(MAX_DOCK_SIZE).optional(),
  dockLeftWidth: z.number().gte(MIN_DOCK_SIZE).lte(MAX_DOCK_SIZE).optional(),
  dockRightWidth: z.number().gte(MIN_DOCK_SIZE).lte(MAX_DOCK_SIZE).optional(),
  width: z.int().gte(MIN_WIDTH).lte(MAX_WIDTH).optional(),
  alignment: z.enum(HorizontalAlignment).optional(),
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
