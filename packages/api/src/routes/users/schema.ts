import { z } from "zod";

export const UpdateUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(64).optional(),
  email: z.string().email().max(254).optional(),
  imageKey: z.string().optional(),
});
export type UpdateUserSchema = z.infer<typeof UpdateUserSchema>;
