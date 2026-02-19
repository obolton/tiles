import { z } from "zod";
import { WorkspaceRole } from "@/generated/prisma/client";

export const GetWorkspaceSchema = z.object({
  workspaceId: z.uuid(),
});
export type GetWorkspaceSchema = z.infer<typeof GetWorkspaceSchema>;

export const CreateWorkspaceSchema = z.object({
  name: z.string().min(1),
});
export type CreateWorkspaceSchema = z.infer<typeof CreateWorkspaceSchema>;

export const UpdateWorkspaceSchema = z.object({
  name: z.string().min(1),
});
export type UpdateWorkspaceSchema = z.infer<typeof UpdateWorkspaceSchema>;

export const InviteToWorkspaceSchema = z.object({
  email: z.email().max(254),
});
export type InviteToWorkspaceSchema = z.infer<typeof InviteToWorkspaceSchema>;

export const AcceptWorkspaceInviteSchema = z.object({
  key: z.string(),
});
export type AcceptWorkspaceInviteSchema = z.infer<
  typeof AcceptWorkspaceInviteSchema
>;

export const DeleteWorkspaceInviteSchema = z.object({
  id: z.uuid(),
});
export type DeleteWorkspaceInviteSchema = z.infer<
  typeof DeleteWorkspaceInviteSchema
>;

export const ListWorkspaceInvitesSchema = z.object({
  query: z.string().min(1).optional(),
  cursor: z.uuid().optional(),
});
export type ListWorkspaceInvitesSchema = z.infer<
  typeof ListWorkspaceInvitesSchema
>;

export const RemoveFromWorkspaceSchema = z.object({
  userId: z.uuid(),
});
export type RemoveFromWorkspaceSchema = z.infer<
  typeof RemoveFromWorkspaceSchema
>;

export const ListWorkspaceUsersSchema = z.object({
  query: z.string().min(1).optional(),
  cursor: z.uuid().optional(),
});
export type ListWorkspaceUsersSchema = z.infer<typeof ListWorkspaceUsersSchema>;

export const UpdateRoleSchema = z.object({
  userId: z.uuid(),
  role: z.enum(WorkspaceRole),
});
export type UpdateRoleSchema = z.infer<typeof UpdateRoleSchema>;
