import { z } from "zod";
import { CollectionType, TileType } from "@prisma/client";
import {
  MIN_LATITUDE,
  MAX_LATITUDE,
  MIN_LONGITUDE,
  MAX_LONGITUDE,
} from "@/constants/geo.ts";

// Tile types

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

// Create

export const CreateTileSchema = z.object({
  pageId: z.string().uuid(),
  tile: z.discriminatedUnion("type", [CollectionTileSchema]),
});
export type CreateTileSchema = z.infer<typeof CreateTileSchema>;

// Update

export const UpdateTileSchema = z.object({
  id: z.string().uuid(),
  tile: z.discriminatedUnion("type", [CollectionTileSchema]),
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
