import { z } from "zod";
import { MediaSource, ImagePurpose, ImageType } from "@/generated/prisma/enums";

export const MediaTypeSchema = z.enum(["image", "profile-image"]);
export type MediaTypeSchema = z.infer<typeof MediaTypeSchema>;

export const CreateUploadURLSchema = z.strictObject({
  workspaceId: z.uuid(),
  type: MediaTypeSchema,
});
export type CreateUploadURLSchema = z.infer<typeof CreateUploadURLSchema>;

export const CreateImageSchema = z.strictObject({
  workspaceId: z.uuid(),
  source: z.enum(MediaSource),
  purpose: z.enum(ImagePurpose),
  type: z.enum(ImageType),
  bytes: z.int().nonnegative().optional(),
  pending: z.boolean().optional(),
});
export type CreateImageSchema = z.infer<typeof CreateImageSchema>;

export const UpdateImageSchema = z.strictObject({
  id: z.uuid(),
  workspaceId: z.uuid(),
  bytes: z.int().nonnegative().optional(),
  width: z.int().nonnegative().optional(),
  height: z.int().nonnegative().optional(),
  pending: z.boolean().optional(),
});
export type UpdateImageSchema = z.infer<typeof UpdateImageSchema>;

export const DeleteImageSchema = z.strictObject({
  id: z.uuid(),
  workspaceId: z.uuid(),
});
export type DeleteImageSchema = z.infer<typeof DeleteImageSchema>;
