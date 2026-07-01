import { z } from "zod";

export const UsernameSchema = z.string().regex(/^[a-zA-Z0-9-]{2,30}$/);

export const CreateUserSchema = z.object({
  name: z.string().min(1).max(64),
  email: z.email().max(254),
  emailVerified: z.boolean(),
  imageUrl: z.string().optional(),
});
export type CreateUserSchema = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
  username: UsernameSchema.nullable().optional(),
  name: z.string().min(1).max(64).optional(),
  email: z.email().max(254).optional(),
  imageKey: z.string().optional(),
});
export type UpdateUserSchema = z.infer<typeof UpdateUserSchema>;

export const IsUsernameAvailableSchema = z.object({
  username: UsernameSchema,
});
export type IsUsernameAvailableSchema = z.infer<typeof IsUsernameAvailableSchema>;
