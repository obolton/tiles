import { z } from "zod";
import { TileType } from "@prisma/client";
import {
  MIN_LATITUDE,
  MAX_LATITUDE,
  MIN_LONGITUDE,
  MAX_LONGITUDE,
} from "../../constants/geo.ts";

// Base

const CreateTileBaseSchema = z.object({
  pageId: z.string().length(36),
});

const UpdateTileBaseSchema = z.object({
  id: z.string().length(36),
  pageId: z.string().length(36),
});

// Tile types

// Image
const ImageTileBaseSchema = z.object({
  type: z.literal(TileType.IMAGE),
  image: z.object({
    imageKey: z.string(),
    caption: z.string().optional(),
  }),
});

export const CreateImageTileSchema =
  CreateTileBaseSchema.merge(ImageTileBaseSchema);
export type CreateImageTileSchema = z.infer<typeof CreateImageTileSchema>;

export const UpdateImageTileSchema =
  UpdateTileBaseSchema.merge(ImageTileBaseSchema);
export type UpdateImageTileSchema = z.infer<typeof UpdateImageTileSchema>;

// Text
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

// Place
const PlaceTileBaseSchema = z.object({
  type: z.literal(TileType.PLACE),
  place: z.object({
    name: z.string(),
    providerId: z.string().nullable(),
    lat: z.number().gte(MIN_LATITUDE).lte(MAX_LATITUDE),
    long: z.number().gte(MIN_LONGITUDE).lte(MAX_LONGITUDE),
    boundingBox: z.array(z.number()).length(4).nullable(),
    address: z.string().nullable(),
  }),
});

export const CreatePlaceTileSchema =
  CreateTileBaseSchema.merge(PlaceTileBaseSchema);
export type CreatePlaceTileSchema = z.infer<typeof CreatePlaceTileSchema>;

export const UpdatePlaceTileSchema =
  UpdateTileBaseSchema.merge(PlaceTileBaseSchema);
export type UpdatePlaceTileSchema = z.infer<typeof UpdatePlaceTileSchema>;

// Link

const LinkTileBaseSchema = z.object({
  type: z.literal(TileType.LINK),
  link: z.object({
    url: z.string().url(),
  }),
});

export const CreateLinkTileSchema =
  CreateTileBaseSchema.merge(LinkTileBaseSchema);
export type CreateLinkTileSchema = z.infer<typeof CreateLinkTileSchema>;

export const UpdateLinkTileSchema =
  UpdateTileBaseSchema.merge(LinkTileBaseSchema);
export type UpdateLinkTileSchema = z.infer<typeof UpdateLinkTileSchema>;

// Create

export const CreateTileSchema = z.discriminatedUnion("type", [
  CreateImageTileSchema,
  CreateTextTileSchema,
  CreatePlaceTileSchema,
  CreateLinkTileSchema,
]);
export type CreateTileSchema = z.infer<typeof CreateTileSchema>;

// Update

export const UpdateTileSchema = z.discriminatedUnion("type", [
  UpdateImageTileSchema,
  UpdateTextTileSchema,
  UpdatePlaceTileSchema,
  UpdateLinkTileSchema,
]);
export type UpdateTileSchema = z.infer<typeof UpdateTileSchema>;

// Move

export const MoveTileSchema = z.object({
  id: z.string().length(36),
  pageId: z.string().length(36),
  position: z.number(),
});
export type MoveTileSchema = z.infer<typeof MoveTileSchema>;

// Delete

export const DeleteTileSchema = z.object({
  id: z.string().length(36),
  pageId: z.string().length(36),
});
export type DeleteTileSchema = z.infer<typeof DeleteTileSchema>;
