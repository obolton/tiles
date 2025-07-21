import { z } from "zod";
import { SectionLayout, SectionWidth } from "@prisma/client";

export const CreateSectionSchema = z.object({
  pageId: z.uuid(),
});
export type CreateSectionSchema = z.infer<typeof CreateSectionSchema>;

export const UpdateSectionSchema = z.object({
  pageId: z.uuid(),
  id: z.uuid(),
  layout: z.enum(SectionLayout).optional(),
  width: z.enum(SectionWidth).optional(),
});
export type UpdateSectionSchema = z.infer<typeof UpdateSectionSchema>;

export const DeleteSectionSchema = z.object({
  pageId: z.uuid(),
  id: z.uuid(),
});
export type DeleteSectionSchema = z.infer<typeof DeleteSectionSchema>;
