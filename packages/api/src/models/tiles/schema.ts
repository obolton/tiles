import { z } from "zod";
import { CollectionType, TileType } from "@prisma/client";
import {
  MIN_LATITUDE,
  MAX_LATITUDE,
  MIN_LONGITUDE,
  MAX_LONGITUDE,
} from "@/constants/geo.ts";

// Tile types

// Video
export const CreateVideoTileSchema = z.object({
  type: z.literal(TileType.VIDEO),
  video: z.object({
    url: z.string().url(),
  }),
});
export type CreateVideoTileSchema = z.infer<typeof CreateVideoTileSchema>;

export const UpdateVideoTileSchema = z.object({
  type: z.literal(TileType.VIDEO),
  video: z.object({
    title: z.string().optional(),
  }),
});
export type UpdateVideoTileSchema = z.infer<typeof UpdateVideoTileSchema>;

// Place
export const PlaceTileSchema = z.object({
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
export type PlaceTileSchema = z.infer<typeof PlaceTileSchema>;

// Link

export const LinkTileSchema = z.object({
  type: z.literal(TileType.LINK),
  link: z.object({
    url: z.string().url(),
  }),
});
export type LinkTileSchema = z.infer<typeof LinkTileSchema>;

// Page link

export const PageLinkTileSchema = z.object({
  type: z.literal(TileType.PAGE_LINK),
  pageLink: z.object({
    pageId: z.string().uuid(),
  }),
});
export type PageLinkTileSchema = z.infer<typeof PageLinkTileSchema>;

// Collection

export const CollectionTileSchema = z.object({
  type: z.literal(TileType.COLLECTION),
  collection: z.object({
    type: z.nativeEnum(CollectionType),
    title: z.string().optional(),
    tileIds: z.array(z.string().uuid()).optional(),
  }),
});
export type CollectionTileSchema = z.infer<typeof CollectionTileSchema>;

// Create

export const CreateTileSchema = z.object({
  pageId: z.string().uuid(),
  tile: z.discriminatedUnion("type", [
    CreateVideoTileSchema,
    LinkTileSchema,
    PageLinkTileSchema,
    CollectionTileSchema,
  ]),
});
export type CreateTileSchema = z.infer<typeof CreateTileSchema>;

// Update

export const UpdateTileSchema = z.object({
  id: z.string().uuid(),
  tile: z.discriminatedUnion("type", [
    UpdateVideoTileSchema,
    LinkTileSchema,
    PageLinkTileSchema,
    CollectionTileSchema,
  ]),
});
export type UpdateTileSchema = z.infer<typeof UpdateTileSchema>;

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
