import { z } from "zod";

// Get by ID

export const GetPageByIdSchema = z.object({
  id: z.string().uuid(),
});
export type GetPageByIdSchema = z.infer<typeof GetPageByIdSchema>;

export const CreatePageSchema = z.object({
  title: z.string().min(1),
});
export type CreatePageSchema = z.infer<typeof CreatePageSchema>;

// Update

export const UpdatePageSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).optional(),
  subtitle: z.string().optional(),
});
export type UpdatePageSchema = z.infer<typeof UpdatePageSchema>;
