import { z } from "zod";
import { Layout, Anchor, Dimensions } from "@/generated/prisma/client";
import { BackgroundSchema } from "@/schema/Background.ts";

const MAX_WIDTH = 64;
const MAX_HEIGHT = 64;

export const SectionSchema = z.object({
  layout: z.enum(Layout).optional(),
  anchor: z.enum(Anchor).nullable().optional(),
  dimensions: z.enum(Dimensions).optional(),
  width: z.int().gte(1).lte(MAX_WIDTH).optional(),
  height: z.int().gte(1).lte(MAX_HEIGHT).optional(),
  background: BackgroundSchema.optional(),
  hide: z.boolean().optional(),
});

export const CreateSectionSchema = z.strictObject({
  pageId: z.uuid(),
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
