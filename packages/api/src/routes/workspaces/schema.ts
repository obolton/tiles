import { z } from "zod";

export const GetWorkspaceSchema = z.object({
  workspaceId: z.string().uuid(),
});
export type GetWorkspaceSchema = z.infer<typeof GetWorkspaceSchema>;

export const UpdateWorkspaceSchema = z.object({
  name: z.string().min(1),
});
export type UpdateWorkspaceSchema = z.infer<typeof UpdateWorkspaceSchema>;

export const InviteToWorkspaceSchema = z.object({
  email: z.string().email().max(254),
});
export type InviteToWorkspaceSchema = z.infer<typeof InviteToWorkspaceSchema>;

export const AcceptWorkspaceInviteSchema = z.object({
  key: z.string(),
});
export type AcceptWorkspaceInviteSchema = z.infer<
  typeof AcceptWorkspaceInviteSchema
>;

export const DeleteWorkspaceInviteSchema = z.object({
  id: z.string().uuid(),
});
export type DeleteWorkspaceInviteSchema = z.infer<
  typeof DeleteWorkspaceInviteSchema
>;

export const ListWorkspaceInvitesSchema = z.object({
  query: z.string().min(1).optional(),
  offset: z.number().int().gte(0).optional(), // TODO: Use cursors
});
export type ListWorkspaceInvitesSchema = z.infer<
  typeof ListWorkspaceInvitesSchema
>;

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
