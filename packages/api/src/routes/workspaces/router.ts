import { router } from "@/utils/trpc.ts";
import {
  authenticatedProcedure,
  authenticatedWorkspaceProcedure,
} from "@/utils/middleware.ts";
import {
  GetWorkspaceSchema,
  UpdateWorkspaceSchema,
  InviteToWorkspaceSchema,
  AcceptWorkspaceInviteSchema,
  DeleteWorkspaceInviteSchema,
  ListWorkspaceInvitesSchema,
  RemoveFromWorkspaceSchema,
  ListWorkspaceUsersSchema,
} from "./schema.ts";
import {
  getWorkspace,
  updateWorkspace,
  inviteToWorkspace,
  acceptWorkspaceInvite,
  deleteWorkspaceInvite,
  listWorkspaceInvites,
  removeFromWorkspace,
  listWorkspaceUsers,
} from "./workspaces.ts";

export default router({
  get: authenticatedWorkspaceProcedure
    .input(GetWorkspaceSchema)
    .query(({ input }) => getWorkspace(input)),

  update: authenticatedWorkspaceProcedure
    .input(UpdateWorkspaceSchema)
    .mutation(({ input, ctx }) => updateWorkspace(input, ctx)),

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
});
