import { z } from "zod";
import { TileSchema } from "@/schema/Tile";

export const UpdateTileSchema = z.object({
  pageId: z.uuid(),
  id: z.uuid(),
  themeId: TileSchema.shape.themeId,
  background: TileSchema.shape.background,
});
export type UpdateTileSchema = z.infer<typeof UpdateTileSchema>;

export const DuplicateTileSchema = z.strictObject({
  pageId: z.uuid(),
  id: z.uuid(),
  sectionId: z.uuid().nullable(),
  beforeId: z.uuid().nullable().optional(),
});
export type DuplicateTileSchema = z.infer<typeof DuplicateTileSchema>;

export const DeleteTilesSchema = z.object({
  pageId: z.uuid(),
  ids: z.array(z.uuid()).min(1).max(20),
});
export type DeleteTilesSchema = z.infer<typeof DeleteTilesSchema>;
