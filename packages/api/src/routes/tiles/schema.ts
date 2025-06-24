import { z } from "zod";

export const MoveTileSchema = z.object({
  pageId: z.string().uuid(),
  id: z.string().uuid(),
  collectionId: z.string().uuid(),
  afterId: z.string().uuid().nullable().optional(),
});
export type MoveTileSchema = z.infer<typeof MoveTileSchema>;

export const ResizeTileSchema = z.object({
  pageId: z.string().uuid(),
  id: z.string().uuid(),
  width: z.number().int().gte(1).lte(12).optional(),
  height: z.number().int().gte(1).lte(24).optional(),
  x: z.number().int().gte(1).lte(12).optional(),
  y: z.number().int().gte(1).lte(24).optional(),
});
export type ResizeTileSchema = z.infer<typeof ResizeTileSchema>;

export const DeleteTileSchema = z.object({
  pageId: z.string().uuid(),
  id: z.string().uuid(),
});
export type DeleteTileSchema = z.infer<typeof DeleteTileSchema>;
