import { z } from "zod";

export const MediaTypeSchema = z.enum(["image", "profile-image"]);
export type MediaTypeSchema = z.infer<typeof MediaTypeSchema>;

export const CreateUploadURLSchema = z.strictObject({
  workspaceId: z.uuid(),
  type: MediaTypeSchema,
});
export type CreateUploadURLSchema = z.infer<typeof CreateUploadURLSchema>;

export const CreateImageSchema = z.strictObject({
  workspaceId: z.uuid(),
});
export type CreateImageSchema = z.infer<typeof CreateImageSchema>;

export const UpdateImageSchema = z.strictObject({
  id: z.uuid(),
  workspaceId: z.uuid(),
  bytes: z.int().nonnegative(),
});
export type UpdateImageSchema = z.infer<typeof UpdateImageSchema>;
