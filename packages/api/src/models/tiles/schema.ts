import { z } from "zod";

// Move

export const MoveTileSchema = z.object({
  id: z.string().uuid(),
  position: z.number(),
});
export type MoveTileSchema = z.infer<typeof MoveTileSchema>;

// Resize

export const ResizeTileSchema = z.object({
  id: z.string().uuid(),
  columns: z.number().int().gte(1).lte(3),
  rows: z.number().int().gte(1).lte(3),
});
export type ResizeTileSchema = z.infer<typeof ResizeTileSchema>;

// Delete

export const DeleteTileSchema = z.object({
  id: z.string().uuid(),
});
export type DeleteTileSchema = z.infer<typeof DeleteTileSchema>;
