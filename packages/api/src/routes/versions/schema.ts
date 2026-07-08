import { z } from "zod";

export const ListVersionsSchema = z.object({
  pageId: z.uuid(),
  cursor: z.uuid().optional(),
});
export type ListVersionsSchema = z.infer<typeof ListVersionsSchema>;

export const GetVersionSchema = z.object({
  pageId: z.uuid(),
  versionId: z.uuid(),
});
export type GetVersionSchema = z.infer<typeof GetVersionSchema>;

export const CreateVersionSchema = z.object({
  pageId: z.uuid(),
  name: z.string().min(1).max(100),
});
export type CreateVersionSchema = z.infer<typeof CreateVersionSchema>;

export const PrepareRestoreSchema = z.object({
  pageId: z.uuid(),
});
export type PrepareRestoreSchema = z.infer<typeof PrepareRestoreSchema>;

export const RenameVersionSchema = z.object({
  pageId: z.uuid(),
  versionId: z.uuid(),
  name: z.string().min(1).max(100),
});
export type RenameVersionSchema = z.infer<typeof RenameVersionSchema>;

export const DeleteVersionSchema = z.object({
  pageId: z.uuid(),
  versionId: z.uuid(),
});
export type DeleteVersionSchema = z.infer<typeof DeleteVersionSchema>;

export const CopyVersionSchema = z.object({
  pageId: z.uuid(),
  versionId: z.uuid(),
  title: z.string().min(1).max(100).optional(),
});
export type CopyVersionSchema = z.infer<typeof CopyVersionSchema>;
