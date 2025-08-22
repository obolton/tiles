import { z } from "zod";
import { PositionSchema } from "@/schema/Position.ts";

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
  ...PositionSchema.shape,
});
export type UpdateTileSchema = z.infer<typeof UpdateTileSchema>;

export const DeleteTileSchema = z.object({
  pageId: z.uuid(),
  id: z.uuid(),
});
export type DeleteTileSchema = z.infer<typeof DeleteTileSchema>;
