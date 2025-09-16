import { z } from "zod";

export const MediaTypeSchema = z.enum(["image", "profile-image"]);
export type MediaTypeSchema = z.infer<typeof MediaTypeSchema>;

export const CreateUploadURLSchema = z.strictObject({
  workspaceId: z.uuid(),
  type: MediaTypeSchema,
});
export type CreateUploadURLSchema = z.infer<typeof CreateUploadURLSchema>;

export const RegisterImageSchema = z.strictObject({
  key: z.string().min(16),
  bytes: z.int().nonnegative(),
  workspaceId: z.uuid(),
  userId: z.uuid(),
});
export type RegisterImageSchema = z.infer<typeof RegisterImageSchema>;
