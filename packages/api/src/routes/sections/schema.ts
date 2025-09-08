import { z } from "zod";
import { SectionLayout } from "@prisma/client";
import { BackgroundSchema } from "@/schema/Background.ts";

export const CreateSectionSchema = z.object({
  pageId: z.uuid(),
  background: BackgroundSchema.optional(),
});
export type CreateSectionSchema = z.infer<typeof CreateSectionSchema>;

export const UpdateSectionSchema = z.object({
  pageId: z.uuid(),
  id: z.uuid(),
  layout: z.enum(SectionLayout).optional(),
  background: BackgroundSchema.optional(),
});
export type UpdateSectionSchema = z.infer<typeof UpdateSectionSchema>;

export const DeleteSectionSchema = z.object({
  pageId: z.uuid(),
  id: z.uuid(),
});
export type DeleteSectionSchema = z.infer<typeof DeleteSectionSchema>;
