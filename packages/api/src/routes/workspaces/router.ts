import { router } from "@/utils/trpc.ts";
import { authenticatedProcedure } from "@/utils/middleware.ts";
import {
  UpdateWorkspaceSchema,
  InviteToWorkspaceSchema,
  RemoveFromWorkspaceSchema,
  ListWorkspaceUsersSchema,
} from "./schema.ts";
import {
  getCurrentWorkspace,
  updateWorkspace,
  inviteToWorkspace,
  removeFromWorkspace,
  listWorkspaceUsers,
} from "./workspaces.ts";

export default router({
  get: authenticatedProcedure.query(({ ctx }) => getCurrentWorkspace(ctx)),

  update: authenticatedProcedure
    .input(UpdateWorkspaceSchema)
    .mutation(({ input, ctx }) => updateWorkspace(input, ctx)),

  invite: authenticatedProcedure
    .input(InviteToWorkspaceSchema)
    .mutation(({ input, ctx }) => inviteToWorkspace(input, ctx)),

  remove: authenticatedProcedure
    .input(RemoveFromWorkspaceSchema)
    .mutation(({ input, ctx }) => removeFromWorkspace(input, ctx)),

  listUsers: authenticatedProcedure
    .input(ListWorkspaceUsersSchema)
    .query(async ({ input, ctx }) => listWorkspaceUsers(input, ctx)),
});
