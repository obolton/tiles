import { z } from "zod";

// Get by ID

export const GetPageByIdSchema = z.object({
  id: z.string().uuid(),
});
export type GetPageByIdSchema = z.infer<typeof GetPageByIdSchema>;

// Get profile page by user ID

export const GetProfilePageByUserIdSchema = z.object({
  userId: z.string().uuid(),
});
export type GetProfilePageByUserIdSchema = z.infer<
  typeof GetProfilePageByUserIdSchema
>;

// Create
export const CreatePageSchema = z.object({
  title: z.string().min(1),
});
export type CreatePageSchema = z.infer<typeof CreatePageSchema>;

// Update

export const UpdatePageSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).optional(),
  subtitle: z.string().optional(),
  hue: z.number().gte(0).lte(360).optional(),
});
export type UpdatePageSchema = z.infer<typeof UpdatePageSchema>;

// Delete

export const DeletePageSchema = z.object({
  id: z.string().uuid(),
});
export type DeletePageSchema = z.infer<typeof DeletePageSchema>;
