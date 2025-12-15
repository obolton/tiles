import { z } from "zod";

export const CreateBookmarkSchema = z.object({
  pageId: z.uuid(),
});
export type CreateBookmarkSchema = z.infer<typeof CreateBookmarkSchema>;

export const DeleteBookmarkSchema = z.object({
  pageId: z.uuid(),
});
export type DeleteBookmarkSchema = z.infer<typeof DeleteBookmarkSchema>;

export const ListBookmarksSchema = z.object({
  query: z.string().min(1).optional(),
  cursor: z.uuid().optional(),
});
export type ListBookmarksSchema = z.infer<typeof ListBookmarksSchema>;

export const IsBookmarkedSchema = z.object({
  pageId: z.uuid(),
});
export type IsBookmarkedSchema = z.infer<typeof IsBookmarkedSchema>;
