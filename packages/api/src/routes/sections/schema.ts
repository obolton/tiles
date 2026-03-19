import { z } from "zod";
import { CreateTileSchema } from "@/schema/Tile";
import { Layout, MapStyle } from "@/generated/prisma/client";

export const SectionSchema = z.object({
  layout: z.enum(Layout).optional(),
  columns: z.int().gte(1).lte(12).nullable().optional(),
  mapStyle: z.enum(MapStyle).nullable().optional(),
});

export const CreateSectionSchema = z.strictObject({
  ...CreateTileSchema.omit({ sectionId: true }).shape,
  ...SectionSchema.shape,
});
export type CreateSectionSchema = z.infer<typeof CreateSectionSchema>;

export const UpdateSectionSchema = z.strictObject({
  pageId: z.uuid(),
  id: z.uuid(),
  ...SectionSchema.shape,
});
export type UpdateSectionSchema = z.infer<typeof UpdateSectionSchema>;
