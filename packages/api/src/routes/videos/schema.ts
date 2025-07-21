import { z } from "zod";

export const CreateVideoSchema = z.object({
  pageId: z.uuid(),
  sectionId: z.uuid(),
  url: z.url(),
});
export type CreateVideoSchema = z.infer<typeof CreateVideoSchema>;

export const UpdateVideoSchema = z.object({
  pageId: z.uuid(),
  id: z.uuid(),
  title: z.string().nullable(),
});
export type UpdateVideoSchema = z.infer<typeof UpdateVideoSchema>;
