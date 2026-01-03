import { z } from "zod";
import {
  Anchor,
  Animation,
  Dimensions,
  DockEdge,
} from "@/generated/prisma/enums";

const MAX_PERCENT = 100;
const MIN_SIZE_PERCENT = 1;
const MAX_ROWS = 32;

export const TileSchema = z.object({
  anchor: z.enum(Anchor).nullable().optional(),
  dimensions: z.enum(Dimensions).optional(),
  width: z.number().gte(MIN_SIZE_PERCENT).lte(MAX_PERCENT).optional(),
  height: z.number().gte(MIN_SIZE_PERCENT).lte(MAX_PERCENT).optional(),
  x: z.number().gte(0).lte(MAX_PERCENT).optional(),
  y: z.number().gte(0).lte(MAX_PERCENT).optional(),
  rowSpan: z.int().gte(1).lte(MAX_ROWS).optional(),
  block: z.boolean().optional(),
  animation: z.enum(Animation).nullable().optional(),
  hide: z.boolean().optional(),
  themeId: z.uuid().nullable().optional(),
  dock: z.enum(DockEdge).nullable().optional(),
});
export type TileSchema = z.infer<typeof TileSchema>;

export const CreateTileSchema = z.object({
  pageId: z.uuid(),
  sectionId: z.uuid().nullable().optional(),
  afterId: z.uuid().nullable().optional(),
  ...TileSchema.shape,
});
export type CreateTileSchema = z.infer<typeof CreateTileSchema>;
