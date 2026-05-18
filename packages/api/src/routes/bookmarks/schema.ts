import { z } from "zod";
import { PaginationSchema } from "@/schema/Pagination";

export const CreateBookmarkSchema = z.object({
  pageId: z.uuid(),
});
export type CreateBookmarkSchema = z.infer<typeof CreateBookmarkSchema>;

export const DeleteBookmarkSchema = z.object({
  pageIds: z.array(z.uuid()).min(1).max(100),
});
export type DeleteBookmarkSchema = z.infer<typeof DeleteBookmarkSchema>;

export const ListBookmarksSchema = PaginationSchema;
export type ListBookmarksSchema = z.infer<typeof ListBookmarksSchema>;

export const IsBookmarkedSchema = z.object({
  pageId: z.uuid(),
});
export type IsBookmarkedSchema = z.infer<typeof IsBookmarkedSchema>;
