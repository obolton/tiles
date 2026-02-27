import { z } from "zod";
import {
  Animation,
  FrameStyle,
  Sizing,
  DockEdge,
} from "@/generated/prisma/enums";
import { BackgroundSchema } from "./Background";
import { ColorSchema } from "./Color";

const MAX_PERCENT = 100;
const MIN_SIZE_PERCENT = 1;
const MAX_ROWS = 32;

export const TileSchema = z.object({
  sizing: z.enum(Sizing).optional(),
  width: z
    .number()
    .gte(MIN_SIZE_PERCENT)
    .lte(MAX_PERCENT)
    .nullable()
    .optional(),
  height: z.number().gte(MIN_SIZE_PERCENT).lte(MAX_PERCENT).optional(),
  x: z.number().gte(0).lte(MAX_PERCENT).optional(),
  y: z.number().gte(0).lte(MAX_PERCENT).optional(),
  rowSpan: z.int().gte(1).lte(MAX_ROWS).optional(),
  animation: z.enum(Animation).nullable().optional(),
  frame: z.enum(FrameStyle).nullable().optional(),
  hide: z.boolean().optional(),
  themeId: z.uuid().nullable().optional(),
  dock: z.enum(DockEdge).nullable().optional(),
  textColor: ColorSchema.nullable().optional(),
  background: BackgroundSchema.nullable().optional(),
});
export type TileSchema = z.infer<typeof TileSchema>;

export const CreateTileSchema = z.object({
  pageId: z.uuid(),
  sectionId: z.uuid().nullable().optional(),
  beforeId: z.uuid().nullable().optional(),
  ...TileSchema.shape,
});
export type CreateTileSchema = z.infer<typeof CreateTileSchema>;
