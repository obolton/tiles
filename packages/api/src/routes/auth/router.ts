import { router, publicProcedure } from "@/utils/trpc";
import { authenticatedServiceProcedure } from "@/utils/middleware";
import { signIn, signOut } from "./auth";
import { SignInSchema } from "./schema";
import { clearSessionCookie } from "@/utils/cookies";

export default router({
  signIn: authenticatedServiceProcedure.input(SignInSchema).mutation(async ({ input }) => {
    const session = await signIn(input);
    return session;
  }),

  signOut: publicProcedure.mutation(async ({ ctx }) => {
    if (ctx.sessionId) {
      clearSessionCookie(ctx.res);
      await signOut(ctx.sessionId);
    }
    return null;
  }),
});
