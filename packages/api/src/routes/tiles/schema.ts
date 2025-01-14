import { z } from "zod";

export const MoveTileSchema = z.object({
  pageId: z.string().uuid(),
  id: z.string().uuid(),
  collectionId: z.string().uuid().nullable(),
  afterId: z.string().uuid().optional(),
});
export type MoveTileSchema = z.infer<typeof MoveTileSchema>;

export const ResizeTileSchema = z.object({
  pageId: z.string().uuid(),
  id: z.string().uuid(),
  columns: z.number().int().gte(1).lte(3),
  rows: z.number().int().gte(1).lte(3),
});
export type ResizeTileSchema = z.infer<typeof ResizeTileSchema>;

export const DeleteTileSchema = z.object({
  pageId: z.string().uuid(),
  id: z.string().uuid(),
});
export type DeleteTileSchema = z.infer<typeof DeleteTileSchema>;
