import { z } from "zod";

export const CreateVideoSchema = z.object({
  pageId: z.string().uuid(),
  url: z.string().url(),
});
export type CreateVideoSchema = z.infer<typeof CreateVideoSchema>;

export const UpdateVideoSchema = z.object({
  pageId: z.string().uuid(),
  id: z.string().uuid(),
  title: z.string().nullable(),
});
export type UpdateVideoSchema = z.infer<typeof UpdateVideoSchema>;
