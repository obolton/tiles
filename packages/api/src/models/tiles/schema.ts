import { z } from "zod";
import { TileType, Theme } from "@prisma/client";
import {
  MIN_LATITUDE,
  MAX_LATITUDE,
  MIN_LONGITUDE,
  MAX_LONGITUDE,
} from "@/constants/geo.ts";
import { RichTextSchema } from "@/schema/RichText.ts";

// Base

const CreateTileBaseSchema = z.object({
  pageId: z.string().uuid(),
});

const UpdateTileBaseSchema = z.object({
  id: z.string().uuid(),
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

// Video
const VideoTileBaseSchema = z.object({
  type: z.literal(TileType.VIDEO),
  video: z.object({
    url: z.string().url(),
  }),
});

export const CreateVideoTileSchema =
  CreateTileBaseSchema.merge(VideoTileBaseSchema);
export type CreateVideoTileSchema = z.infer<typeof CreateVideoTileSchema>;

export const UpdateVideoTileSchema =
  UpdateTileBaseSchema.merge(VideoTileBaseSchema);
export type UpdateVideoTileSchema = z.infer<typeof UpdateVideoTileSchema>;

// Text

const TextTileBaseSchema = z.object({
  type: z.literal(TileType.TEXT),
  text: z.object({
    content: RichTextSchema.optional(),
    theme: z.nativeEnum(Theme).optional(),
    hue: z.number().gte(0).lte(360).optional(),
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

// Heading
const HeadingTileBaseSchema = z.object({
  type: z.literal(TileType.HEADING),
  heading: z.object({
    content: z.string(),
  }),
});

export const CreateHeadingTileSchema = CreateTileBaseSchema.merge(
  HeadingTileBaseSchema,
);
export type CreateHeadingTileSchema = z.infer<typeof CreateHeadingTileSchema>;

export const UpdateHeadingTileSchema = UpdateTileBaseSchema.merge(
  HeadingTileBaseSchema,
);
export type UpdateHeadingTileSchema = z.infer<typeof UpdateHeadingTileSchema>;

// Page link

const PageLinkTileBaseSchema = z.object({
  type: z.literal(TileType.PAGE_LINK),
  pageLink: z.object({
    pageId: z.string().uuid(),
  }),
});

export const CreatePageLinkTileSchema = CreateTileBaseSchema.merge(
  PageLinkTileBaseSchema,
);
export type CreatePageLinkTileSchema = z.infer<typeof CreatePageLinkTileSchema>;

export const UpdatePageLinkTileSchema = UpdateTileBaseSchema.merge(
  PageLinkTileBaseSchema,
);
export type UpdatePageLinkTileSchema = z.infer<typeof UpdatePageLinkTileSchema>;

// Event

const EventTileBaseSchema = z.object({
  type: z.literal(TileType.EVENT),
  event: z.object({
    title: z.string().nullable(),
    start: z.string().datetime(),
    end: z.string().datetime().nullable(),
    allDay: z.boolean().optional(),
    timeZone: z.string().optional(),
  }),
});

export const CreateEventTileSchema =
  CreateTileBaseSchema.merge(EventTileBaseSchema);
export type CreateEventTileSchema = z.infer<typeof CreateEventTileSchema>;

export const UpdateEventTileSchema =
  UpdateTileBaseSchema.merge(EventTileBaseSchema);
export type UpdateEventTileSchema = z.infer<typeof UpdateEventTileSchema>;

// Create

export const CreateTileSchema = z.discriminatedUnion("type", [
  CreateImageTileSchema,
  CreateVideoTileSchema,
  CreateTextTileSchema,
  CreatePlaceTileSchema,
  CreateLinkTileSchema,
  CreateHeadingTileSchema,
  CreatePageLinkTileSchema,
  CreateEventTileSchema,
]);
export type CreateTileSchema = z.infer<typeof CreateTileSchema>;

// Update

export const UpdateTileSchema = z.discriminatedUnion("type", [
  UpdateImageTileSchema,
  UpdateVideoTileSchema,
  UpdateTextTileSchema,
  UpdatePlaceTileSchema,
  UpdateLinkTileSchema,
  UpdateHeadingTileSchema,
  UpdatePageLinkTileSchema,
  UpdateEventTileSchema,
]);
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
