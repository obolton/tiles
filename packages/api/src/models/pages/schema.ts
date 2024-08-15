import { z } from "zod";
import { Theme, Font } from "@prisma/client";

// Get by ID

export const GetPageByIdSchema = z.object({
  id: z.string().uuid(),
});
export type GetPageByIdSchema = z.infer<typeof GetPageByIdSchema>;

// Get recent pages

export const GetRecentPagesWithTilesSchema = z.object({
  offset: z.number().int().gte(0).optional(), // TODO: Use cursors
});
export type GetRecentPagesWithTilesSchema = z.infer<
  typeof GetRecentPagesWithTilesSchema
>;

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
  theme: z.nativeEnum(Theme).optional(),
  hue: z.number().gte(0).lte(360).optional(),
  font: z.nativeEnum(Font).optional(),
});
export type UpdatePageSchema = z.infer<typeof UpdatePageSchema>;

// Delete

export const DeletePageSchema = z.object({
  id: z.string().uuid(),
});
export type DeletePageSchema = z.infer<typeof DeletePageSchema>;
