import { z } from "zod";

export const CreateFolderSchema = z.object({
  name: z.string().min(1),
});
export type CreateFolderSchema = z.infer<typeof CreateFolderSchema>;

export const GetFolderSchema = z.object({
  id: z.uuid(),
});
export type GetFolderSchema = z.infer<typeof GetFolderSchema>;

export const UpdateFolderSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
});
export type UpdateFolderSchema = z.infer<typeof UpdateFolderSchema>;

export const DeleteFolderSchema = z.object({
  id: z.uuid(),
});
export type DeleteFolderSchema = z.infer<typeof DeleteFolderSchema>;

export const ListFoldersSchema = z.object({
  query: z.string().min(1).optional(),
  offset: z.number().int().gte(0).optional(), // TODO: Use cursors
});
export type ListFoldersSchema = z.infer<typeof ListFoldersSchema>;

export const ListPagesSchema = z.object({
  id: z.uuid(),
  query: z.string().min(1).optional(),
  offset: z.number().int().gte(0).optional(), // TODO: Use cursors
});
export type ListPagesSchema = z.infer<typeof ListPagesSchema>;
