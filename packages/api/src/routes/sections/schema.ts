import { z } from "zod";
import { TileSchema } from "@/schema/Tile";
import { Layout } from "@/generated/prisma/client";
import { BackgroundSchema } from "@/schema/Background.ts";

export const SectionSchema = z.object({
  layout: z.enum(Layout).optional(),
  background: BackgroundSchema.optional(),
});

export const CreateSectionSchema = z.strictObject({
  pageId: z.uuid(),
  ...TileSchema.shape,
  afterSectionId: z.uuid().nullable(),
  ...SectionSchema.shape,
});
export type CreateSectionSchema = z.infer<typeof CreateSectionSchema>;

export const UpdateSectionSchema = z.strictObject({
  pageId: z.uuid(),
  id: z.uuid(),
  afterSectionId: z.uuid().nullable().optional(),
  ...SectionSchema.shape,
});
export type UpdateSectionSchema = z.infer<typeof UpdateSectionSchema>;

export const DuplicateSectionSchema = z.strictObject({
  pageId: z.uuid(),
  id: z.uuid(),
});
export type DuplicateSectionSchema = z.infer<typeof DuplicateSectionSchema>;

export const DeleteSectionSchema = z.strictObject({
  pageId: z.uuid(),
  id: z.uuid(),
});
export type DeleteSectionSchema = z.infer<typeof DeleteSectionSchema>;
