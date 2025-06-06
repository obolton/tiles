import { router, publicProcedure } from "@/utils/trpc.ts";
import { authenticatedProcedure } from "@/utils/middleware.ts";
import { signIn, signOut } from "./auth.ts";
import { SignInSchema } from "./schema.ts";
import { clearSessionCookie } from "@/utils/cookies.ts";
import { getCurrentUser } from "@/routes/users/users.ts";

export default router({
  signIn: publicProcedure.input(SignInSchema).mutation(async ({ input }) => {
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
  getUserInfo: authenticatedProcedure.query(({ ctx }) => getCurrentUser(ctx)),
});
