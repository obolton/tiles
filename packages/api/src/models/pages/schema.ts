import { z } from "zod";

export const GetPageByIdSchema = z.object({
  id: z.string().length(36),
});
export type GetPageByIdSchema = z.infer<typeof GetPageByIdSchema>;

export const CreatePageSchema = z.object({
  authorId: z.string().length(36),
  title: z.string().min(1),
});
export type CreatePageSchema = z.infer<typeof CreatePageSchema>;

export const UpdatePageSchema = z.object({
  id: z.string().length(36),
  title: z.string().min(1),
});
export type UpdatePageSchema = z.infer<typeof UpdatePageSchema>;
