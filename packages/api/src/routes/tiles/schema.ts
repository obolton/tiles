import { z } from "zod";

export const ReorderTileSchema = z.object({
  pageId: z.uuid(),
  id: z.uuid(),
  sectionId: z.uuid(),
  afterId: z.uuid().nullable().optional(),
});
export type ReorderTileSchema = z.infer<typeof ReorderTileSchema>;

export const ResizeTileSchema = z.object({
  pageId: z.uuid(),
  id: z.uuid(),
  x: z.number().int().gte(0).lt(32).optional(),
  y: z.number().int().gte(0).lt(24).optional(),
  width: z.number().int().gte(1).lte(32).optional(),
  height: z.number().int().gte(1).lte(24).optional(),
});
export type ResizeTileSchema = z.infer<typeof ResizeTileSchema>;

export const DeleteTileSchema = z.object({
  pageId: z.uuid(),
  id: z.uuid(),
});
export type DeleteTileSchema = z.infer<typeof DeleteTileSchema>;
