import { z } from "zod";
import { CollectionLayout, CollectionWidth } from "@prisma/client";

export const CreateSectionSchema = z.object({
  pageId: z.string().uuid(),
  title: z.string().optional(),
});
export type CreateSectionSchema = z.infer<typeof CreateSectionSchema>;

export const UpdateSectionSchema = z.object({
  pageId: z.string().uuid(),
  id: z.string().uuid(),
  layout: z.nativeEnum(CollectionLayout).optional(),
  width: z.nativeEnum(CollectionWidth).optional(),
});
export type UpdateSectionSchema = z.infer<typeof UpdateSectionSchema>;

export const DeleteSectionSchema = z.object({
  pageId: z.string().uuid(),
  id: z.string().uuid(),
});
export type DeleteSectionSchema = z.infer<typeof DeleteSectionSchema>;
