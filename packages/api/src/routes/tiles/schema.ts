import { z } from "zod";

const MAX_WIDTH = 32;
const MAX_HEIGHT = 32;
const MAX_X = 32;
const MAX_Y = 32;

export const ReorderTileSchema = z.object({
  pageId: z.uuid(),
  id: z.uuid(),
  sectionId: z.uuid(),
  afterId: z.uuid().nullable().optional(),
});
export type ReorderTileSchema = z.infer<typeof ReorderTileSchema>;

export const UpdateTileSchema = z.object({
  pageId: z.uuid(),
  id: z.uuid(),
  sectionId: z.uuid().optional(),
  x: z.number().int().gte(0).lt(MAX_X).optional(),
  y: z.number().int().gte(0).lt(MAX_Y).optional(),
  width: z.number().int().gte(1).lte(MAX_WIDTH).optional(),
  height: z.number().int().gte(1).lte(MAX_HEIGHT).optional(),
  block: z.boolean().optional(),
});
export type UpdateTileSchema = z.infer<typeof UpdateTileSchema>;

export const DeleteTileSchema = z.object({
  pageId: z.uuid(),
  id: z.uuid(),
});
export type DeleteTileSchema = z.infer<typeof DeleteTileSchema>;
