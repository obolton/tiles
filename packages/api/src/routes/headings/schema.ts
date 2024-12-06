import { z } from "zod";

export const CreateHeadingSchema = z.object({
  pageId: z.string().uuid(),
  content: z.string(),
});
export type CreateHeadingSchema = z.infer<typeof CreateHeadingSchema>;

export const UpdateHeadingSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
});
export type UpdateHeadingSchema = z.infer<typeof UpdateHeadingSchema>;
