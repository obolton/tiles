import { z } from "zod";
import { TileType } from "@prisma/client";

// Base

const CreateTileBaseSchema = z.object({
  pageId: z.string(),
});

const UpdateTileBaseSchema = z.object({
  id: z.string().optional(),
  pageId: z.string(),
});

// Tile types

const ImageTileBaseSchema = z.object({
  type: z.literal(TileType.IMAGE),
  image: z.object({
    imageKey: z.string(),
  }),
});
export const CreateImageTileSchema =
  CreateTileBaseSchema.merge(ImageTileBaseSchema);
export type CreateImageTileSchema = z.infer<typeof CreateImageTileSchema>;

export const UpdateImageTileSchema =
  UpdateTileBaseSchema.merge(ImageTileBaseSchema);
export type UpdateImageTileSchema = z.infer<typeof UpdateImageTileSchema>;

const TextTileBaseSchema = z.object({
  type: z.literal(TileType.TEXT),
  text: z.object({
    content: z.string(),
  }),
});
export const CreateTextTileSchema =
  CreateTileBaseSchema.merge(TextTileBaseSchema);
export type CreateTextTileSchema = z.infer<typeof CreateTextTileSchema>;

export const UpdateTextTileSchema =
  UpdateTileBaseSchema.merge(TextTileBaseSchema);
export type UpdateTextTileSchema = z.infer<typeof UpdateTextTileSchema>;

// Create

export const CreateTileSchema = z.discriminatedUnion("type", [
  CreateImageTileSchema,
  CreateTextTileSchema,
]);
export type CreateTileSchema = z.infer<typeof CreateTileSchema>;

// Update

export const UpdateTileSchema = z.discriminatedUnion("type", [
  UpdateImageTileSchema,
  UpdateTextTileSchema,
]);
export type UpdateTileSchema = z.infer<typeof UpdateTileSchema>;

// Move

export const MoveTileSchema = z.object({
  id: z.string(),
  pageId: z.string(),
  position: z.number(),
});
export type MoveTileSchema = z.infer<typeof MoveTileSchema>;
