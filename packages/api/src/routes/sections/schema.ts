import { z } from "zod";
import { SectionLayout, SectionWidth } from "@prisma/client";

export const CreateSectionSchema = z.object({
  pageId: z.string().uuid(),
});
export type CreateSectionSchema = z.infer<typeof CreateSectionSchema>;

export const UpdateSectionSchema = z.object({
  pageId: z.string().uuid(),
  id: z.string().uuid(),
  layout: z.nativeEnum(SectionLayout).optional(),
  width: z.nativeEnum(SectionWidth).optional(),
});
export type UpdateSectionSchema = z.infer<typeof UpdateSectionSchema>;

export const DeleteSectionSchema = z.object({
  pageId: z.string().uuid(),
  id: z.string().uuid(),
});
export type DeleteSectionSchema = z.infer<typeof DeleteSectionSchema>;
