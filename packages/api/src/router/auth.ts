import { router, publicProcedure } from "./trpc.ts";
import { signIn, signOut } from "@/models/users/auth.ts";
import { SignInSchema } from "@/models/users/schema.ts";
import { clearSessionCookie } from "@/utils/cookies.ts";

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
  getUserInfo: publicProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),
});
