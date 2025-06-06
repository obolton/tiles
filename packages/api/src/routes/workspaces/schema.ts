import { z } from "zod";

export const UpdateWorkspaceSchema = z.object({
  name: z.string().min(1),
});
export type UpdateWorkspaceSchema = z.infer<typeof UpdateWorkspaceSchema>;

export const InviteToWorkspaceSchema = z.object({
  email: z.string().email().max(254),
});
export type InviteToWorkspaceSchema = z.infer<typeof InviteToWorkspaceSchema>;

export const RemoveFromWorkspaceSchema = z.object({
  userId: z.string().uuid(),
});
export type RemoveFromWorkspaceSchema = z.infer<
  typeof RemoveFromWorkspaceSchema
>;

export const ListWorkspaceUsersSchema = z.object({
  query: z.string().min(1).optional(),
  offset: z.number().int().gte(0).optional(), // TODO: Use cursors
});
export type ListWorkspaceUsersSchema = z.infer<typeof ListWorkspaceUsersSchema>;
