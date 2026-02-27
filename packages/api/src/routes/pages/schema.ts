import { z } from "zod";
import { ColorSchema } from "@/schema/Color";
import { PaginationSchema, SortDirection } from "@/schema/Pagination";
import { Font, HorizontalAlignment } from "@/generated/prisma/client";

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
});
export type CreatePageSchema = z.infer<typeof CreatePageSchema>;

const MIN_DOCK_SIZE = 100;
const MAX_DOCK_SIZE = 1000;

export const UpdatePageSchema = z.object({
  pageId: z.uuid(),
  published: z.boolean().optional(),
  title: z.string().min(1).optional(),
  backgroundColor: ColorSchema.nullable().optional(),
  font: z.enum(Font).optional(),
  coverImageKey: z.string().nullable().optional(),
  folderId: z.uuid().nullable().optional(),
  themeId: z.uuid().nullable().optional(),
  dockTopHeight: z
    .number()
    .gte(MIN_DOCK_SIZE)
    .lte(MAX_DOCK_SIZE)
    .nullable()
    .optional(),
  dockBottomHeight: z
    .number()
    .gte(MIN_DOCK_SIZE)
    .lte(MAX_DOCK_SIZE)
    .nullable()
    .optional(),
  dockLeftWidth: z
    .number()
    .gte(MIN_DOCK_SIZE)
    .lte(MAX_DOCK_SIZE)
    .nullable()
    .optional(),
  dockRightWidth: z
    .number()
    .gte(MIN_DOCK_SIZE)
    .lte(MAX_DOCK_SIZE)
    .nullable()
    .optional(),
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
