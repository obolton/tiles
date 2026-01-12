import { z } from "zod";
import { ColorSchema } from "@/schema/Color";
import { PaginationSchema, SortDirection } from "@/schema/Pagination";
import { Font } from "@/generated/prisma/client";

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
