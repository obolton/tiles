import { z } from "zod";
import { Layout, Anchor, Dimensions } from "@/generated/prisma/client";
import { BackgroundSchema } from "@/schema/Background.ts";

const MAX_WIDTH = 64;
const MAX_HEIGHT = 64;

export const CreateSectionSchema = z.object({
  pageId: z.uuid(),
  layout: z.enum(Layout).optional(),
  anchor: z.enum(Anchor).optional(),
  dimensions: z.enum(Dimensions).optional(),
  width: z.int().gte(1).lte(MAX_WIDTH).optional(),
  height: z.int().gte(1).lte(MAX_HEIGHT).optional(),
  background: BackgroundSchema.optional(),
  hide: z.boolean().optional(),
  afterSectionId: z.uuid().nullable(),
});
export type CreateSectionSchema = z.infer<typeof CreateSectionSchema>;

export const UpdateSectionSchema = z.object({
  pageId: z.uuid(),
  id: z.uuid(),
  layout: z.enum(Layout).optional(),
  anchor: z.enum(Anchor).optional(),
  dimensions: z.enum(Dimensions).optional(),
  width: z.int().gte(1).lte(MAX_WIDTH).optional(),
  height: z.int().gte(1).lte(MAX_HEIGHT).optional(),
  background: BackgroundSchema.optional(),
  hide: z.boolean().optional(),
  afterSectionId: z.uuid().nullable().optional(),
});
export type UpdateSectionSchema = z.infer<typeof UpdateSectionSchema>;

export const DeleteSectionSchema = z.object({
  pageId: z.uuid(),
  id: z.uuid(),
});
export type DeleteSectionSchema = z.infer<typeof DeleteSectionSchema>;
