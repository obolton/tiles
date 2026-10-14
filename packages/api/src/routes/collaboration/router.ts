import { router } from "@/utils/trpc";
import { authenticatedProcedure, authenticatedPageProcedure } from "@/utils/middleware";
import {
  inviteToPage,
  acceptPageInvite,
  deletePageInvite,
  revokePageAccess,
} from "./collaboration";
import {
  InviteToPageSchema,
  AcceptPageInviteSchema,
  DeletePageInviteSchema,
  RevokePageAccessSchema,
} from "./schema";

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
