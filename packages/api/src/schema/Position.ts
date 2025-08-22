import { z } from "zod";

const MAX_WIDTH = 32;
const MAX_HEIGHT = 32;
const MAX_ROWS = 32;
const MAX_X = 32;
const MAX_Y = 32;

export const PositionSchema = z.object({
  x: z.int().gte(0).lte(MAX_X).optional(),
  y: z.int().gte(0).lte(MAX_Y).optional(),
  width: z.int().gte(1).lte(MAX_WIDTH).optional(),
  height: z.int().gte(1).lte(MAX_HEIGHT).optional(),
  rowSpan: z.int().gte(1).lte(MAX_ROWS).optional(),
  block: z.boolean().optional(),
});
export type PositionSchema = z.infer<typeof PositionSchema>;
