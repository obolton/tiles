import { z } from "zod";

export const CreateBookmarkSchema = z.object({
  pageId: z.string().uuid(),
});
export type CreateBookmarkSchema = z.infer<typeof CreateBookmarkSchema>;

export const DeleteBookmarkSchema = z.object({
  pageId: z.string().uuid(),
});
export type DeleteBookmarkSchema = z.infer<typeof DeleteBookmarkSchema>;

export const ListBookmarksSchema = z.object({
  offset: z.number().int().gte(0).optional(), // TODO: Use cursors
});
export type ListBookmarksSchema = z.infer<typeof ListBookmarksSchema>;

export const IsBookmarkedSchema = z.object({
  pageId: z.string().uuid(),
});
export type IsBookmarkedSchema = z.infer<typeof IsBookmarkedSchema>;
