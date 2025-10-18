import { z } from "zod";
import { TileSchema } from "@/schema/Tile";

export const ReorderTileSchema = z.object({
  pageId: z.uuid(),
  id: z.uuid(),
  sectionId: z.uuid(),
  afterId: z.uuid().nullable().optional(),
});
export type ReorderTileSchema = z.infer<typeof ReorderTileSchema>;

export const UpdateTileSchema = z.object({
  pageId: z.uuid(),
  id: z.uuid(),
  sectionId: z.uuid().optional(),
  ...TileSchema.shape,
});
export type UpdateTileSchema = z.infer<typeof UpdateTileSchema>;

export const DeleteTilesSchema = z.object({
  pageId: z.uuid(),
  ids: z.array(z.uuid()).min(1).max(20),
});
export type DeleteTilesSchema = z.infer<typeof DeleteTilesSchema>;
