import { z } from "zod";
import { Anchor, Dimensions, Animation } from "@/generated/prisma/enums";

const MAX_WIDTH = 64;
const MAX_HEIGHT = 64;
const MAX_ROWS = 32;
const MAX_X = 32;
const MAX_Y = 32;

export const TileSchema = z.object({
  anchor: z.enum(Anchor).nullable().optional(),
  dimensions: z.enum(Dimensions).optional(),
  width: z.int().gte(1).lte(MAX_WIDTH).optional(),
  height: z.int().gte(1).lte(MAX_HEIGHT).optional(),
  x: z.int().gte(0).lte(MAX_X).optional(),
  y: z.int().gte(0).lte(MAX_Y).optional(),
  rowSpan: z.int().gte(1).lte(MAX_ROWS).optional(),
  block: z.boolean().optional(),
  animation: z.enum(Animation).nullable().optional(),
  hide: z.boolean().optional(),
});
export type TileSchema = z.infer<typeof TileSchema>;

export const CreateTileSchema = z.object({
  pageId: z.uuid(),
  sectionId: z.uuid().nullable().optional(),
  afterId: z.uuid().nullable().optional(),
  ...TileSchema.shape,
});
export type CreateTileSchema = z.infer<typeof CreateTileSchema>;
