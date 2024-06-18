import { z } from "zod";

export const GetPageByIdSchema = z.object({
  id: z.string().length(36),
});
export type GetPageByIdSchema = z.infer<typeof GetPageByIdSchema>;

export const UpdatePageSchema = z.object({
  id: z.string().length(36),
  title: z.string().min(1),
});
export type UpdatePageSchema = z.infer<typeof UpdatePageSchema>;
