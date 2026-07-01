import { router } from "@/utils/trpc.ts";
import { authenticatedProcedure, authenticatedPageProcedure } from "@/utils/middleware.ts";
import {
  inviteToPage,
  acceptPageInvite,
  deletePageInvite,
  revokePageAccess,
} from "./collaboration.ts";
import {
  InviteToPageSchema,
  AcceptPageInviteSchema,
  DeletePageInviteSchema,
  RevokePageAccessSchema,
} from "./schema.ts";

export default router({
  inviteToPage: authenticatedPageProcedure
    .input(InviteToPageSchema)
    .mutation(async ({ input, ctx }) => inviteToPage(input, ctx)),

  acceptPageInvite: authenticatedProcedure
    .input(AcceptPageInviteSchema)
    .mutation(async ({ input, ctx }) => acceptPageInvite(input, ctx)),

  deletePageInvite: authenticatedPageProcedure
    .input(DeletePageInviteSchema)
    .mutation(async ({ input }) => deletePageInvite(input)),

  revokePageAccess: authenticatedPageProcedure
    .input(RevokePageAccessSchema)
    .mutation(({ input }) => revokePageAccess(input)),
});
