import { z } from "zod";
import { TileType } from "@prisma/client";

export const BaseTileSchema = z.object({
  id: z.string().optional(),
  pageId: z.string(),
});

export const ImageTileSchema = BaseTileSchema.extend({
  type: z.literal(TileType.IMAGE),
  imageKey: z.string(),
});
export type ImageTileSchema = z.infer<typeof ImageTileSchema>;

export const TextTileSchema = BaseTileSchema.extend({
  type: z.literal(TileType.TEXT),
  content: z.string(),
});
export type TextTileSchema = z.infer<typeof TextTileSchema>;

export const TileSchema = z.discriminatedUnion("type", [
  ImageTileSchema,
  TextTileSchema,
]);
export type TileSchema = z.infer<typeof TileSchema>;
