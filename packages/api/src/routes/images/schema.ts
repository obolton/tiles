import { z } from "zod";

export const CreateImageSchema = z.object({
  pageId: z.string().uuid(),
  imageKey: z.string(),
  caption: z.string().optional(),
});
export type CreateImageSchema = z.infer<typeof CreateImageSchema>;

export const UpdateImageSchema = z.object({
  pageId: z.string().uuid(),
  id: z.string().uuid(),
  caption: z.string().optional(),
  origin: z
    .object({
      x: z.number().gte(0).lte(1),
      y: z.number().gte(0).lte(1),
    })
    .optional(),
});
export type UpdateImageSchema = z.infer<typeof UpdateImageSchema>;
