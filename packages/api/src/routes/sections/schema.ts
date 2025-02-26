import { z } from "zod";

export const CreateSectionSchema = z.object({
  pageId: z.string().uuid(),
  title: z.string().optional(),
});
export type CreateSectionSchema = z.infer<typeof CreateSectionSchema>;

export const DeleteSectionSchema = z.object({
  pageId: z.string().uuid(),
  id: z.string().uuid(),
});
export type DeleteSectionSchema = z.infer<typeof DeleteSectionSchema>;
