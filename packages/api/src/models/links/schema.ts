import { z } from "zod";

export const CreateLinkSchema = z.object({
  pageId: z.string().uuid(),
  url: z.string().url(),
});
export type CreateLinkSchema = z.infer<typeof CreateLinkSchema>;

export const UpdateLinkSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
});
export type UpdateLinkSchema = z.infer<typeof UpdateLinkSchema>;
