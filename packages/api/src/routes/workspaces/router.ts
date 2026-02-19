import { router } from "@/utils/trpc.ts";
import {
  authenticatedProcedure,
  authenticatedWorkspaceProcedure,
  adminWorkspaceProcedure,
} from "@/utils/middleware.ts";
import {
  GetWorkspaceSchema,
  CreateWorkspaceSchema,
  UpdateWorkspaceSchema,
  DeleteWorkspaceSchema,
  InviteToWorkspaceSchema,
  AcceptWorkspaceInviteSchema,
  DeleteWorkspaceInviteSchema,
  ListWorkspaceInvitesSchema,
  RemoveFromWorkspaceSchema,
  ListWorkspaceUsersSchema,
  UpdateRoleSchema,
} from "./schema.ts";
import {
  getWorkspace,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  inviteToWorkspace,
  acceptWorkspaceInvite,
  deleteWorkspaceInvite,
  listWorkspaceInvites,
  removeFromWorkspace,
  listWorkspaceUsers,
  updateWorkspaceRole,
} from "./workspaces.ts";

export default router({
  get: authenticatedWorkspaceProcedure
    .input(GetWorkspaceSchema)
    .query(({ input }) => getWorkspace(input)),

  create: authenticatedProcedure
    .input(CreateWorkspaceSchema)
    .mutation(async ({ input, ctx }) => createWorkspace(input, ctx)),

  update: authenticatedWorkspaceProcedure
    .input(UpdateWorkspaceSchema)
    .mutation(({ input, ctx }) => updateWorkspace(input, ctx)),

  delete: authenticatedWorkspaceProcedure
    .input(DeleteWorkspaceSchema)
    .mutation(({ ctx }) => deleteWorkspace(ctx)),

  invite: authenticatedWorkspaceProcedure
    .input(InviteToWorkspaceSchema)
    .mutation(({ input, ctx }) => inviteToWorkspace(input, ctx)),

  acceptInvite: authenticatedProcedure
    .input(AcceptWorkspaceInviteSchema)
    .mutation(async ({ input, ctx }) => acceptWorkspaceInvite(input, ctx)),

  deleteInvite: authenticatedWorkspaceProcedure
    .input(DeleteWorkspaceInviteSchema)
    .mutation(async ({ input, ctx }) => deleteWorkspaceInvite(input, ctx)),

  listInvites: authenticatedWorkspaceProcedure
    .input(ListWorkspaceInvitesSchema)
    .query(async ({ input, ctx }) => listWorkspaceInvites(input, ctx)),

  remove: authenticatedWorkspaceProcedure
    .input(RemoveFromWorkspaceSchema)
    .mutation(({ input, ctx }) => removeFromWorkspace(input, ctx)),

  listUsers: authenticatedWorkspaceProcedure
    .input(ListWorkspaceUsersSchema)
    .query(async ({ input, ctx }) => listWorkspaceUsers(input, ctx)),

  updateRole: adminWorkspaceProcedure
    .input(UpdateRoleSchema)
    .mutation(({ input, ctx }) => updateWorkspaceRole(input, ctx)),
});
