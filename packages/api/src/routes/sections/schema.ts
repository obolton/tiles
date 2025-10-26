import { z } from "zod";
import { CreateTileSchema } from "@/schema/Tile";
import { Layout } from "@/generated/prisma/client";
import { BackgroundSchema } from "@/schema/Background";

export const SectionSchema = z.object({
  layout: z.enum(Layout).optional(),
  background: BackgroundSchema.optional(),
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
