import { z } from "zod";
import { CollectionType, TileType, Theme } from "@prisma/client";
import {
  MIN_LATITUDE,
  MAX_LATITUDE,
  MIN_LONGITUDE,
  MAX_LONGITUDE,
} from "@/constants/geo.ts";
import { RichTextSchema } from "@/schema/RichText.ts";

// Tile types

// Image
export const ImageTileSchema = z.object({
  type: z.literal(TileType.IMAGE),
  image: z.object({
    imageKey: z.string(),
    caption: z.string().optional(),
  }),
});
export type ImageTileSchema = z.infer<typeof ImageTileSchema>;

// Video
export const VideoTileSchema = z.object({
  type: z.literal(TileType.VIDEO),
  video: z.object({
    url: z.string().url(),
  }),
});
export type VideoTileSchema = z.infer<typeof VideoTileSchema>;

// Text

export const TextTileSchema = z.object({
  type: z.literal(TileType.TEXT),
  text: z.object({
    content: RichTextSchema.optional(),
    theme: z.nativeEnum(Theme).optional(),
    hue: z.number().gte(0).lte(360).optional(),
  }),
});
export type TextTileSchema = z.infer<typeof TextTileSchema>;

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

// Map
export const MapTileSchema = z.object({
  type: z.literal(TileType.MAP),
  place: z.object({
    name: z.string(),
    providerId: z.string().nullable(),
    lat: z.number().gte(MIN_LATITUDE).lte(MAX_LATITUDE),
    long: z.number().gte(MIN_LONGITUDE).lte(MAX_LONGITUDE),
    boundingBox: z.array(z.number()).length(4).nullable(),
    address: z.string().nullable(),
  }),
});
export type MapTileSchema = z.infer<typeof MapTileSchema>;

// Link

export const LinkTileSchema = z.object({
  type: z.literal(TileType.LINK),
  link: z.object({
    url: z.string().url(),
  }),
});
export type LinkTileSchema = z.infer<typeof LinkTileSchema>;

// Heading
export const HeadingTileSchema = z.object({
  type: z.literal(TileType.HEADING),
  heading: z.object({
    content: z.string(),
  }),
});
export type HeadingTileSchema = z.infer<typeof HeadingTileSchema>;

// Page link

export const PageLinkTileSchema = z.object({
  type: z.literal(TileType.PAGE_LINK),
  pageLink: z.object({
    pageId: z.string().uuid(),
  }),
});
export type PageLinkTileSchema = z.infer<typeof PageLinkTileSchema>;

// Event

export const EventTileSchema = z.object({
  type: z.literal(TileType.EVENT),
  event: z.object({
    title: z.string().nullable(),
    start: z.string().datetime(),
    end: z.string().datetime().nullable(),
    allDay: z.boolean().optional(),
    timeZone: z.string().optional(),
  }),
});
export type EventTileSchema = z.infer<typeof EventTileSchema>;

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
    ImageTileSchema,
    VideoTileSchema,
    TextTileSchema,
    LinkTileSchema,
    HeadingTileSchema,
    PageLinkTileSchema,
    EventTileSchema,
    CollectionTileSchema,
    MapTileSchema,
  ]),
});
export type CreateTileSchema = z.infer<typeof CreateTileSchema>;

// Update

export const UpdateTileSchema = z.object({
  id: z.string().uuid(),
  tile: z.discriminatedUnion("type", [
    ImageTileSchema,
    VideoTileSchema,
    TextTileSchema,
    LinkTileSchema,
    HeadingTileSchema,
    PageLinkTileSchema,
    EventTileSchema,
    CollectionTileSchema,
    MapTileSchema,
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
