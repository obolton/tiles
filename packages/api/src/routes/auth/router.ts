import { router, publicProcedure } from "@/utils/trpc";
import { authenticatedServiceProcedure } from "@/utils/middleware";
import { signIn, signOut } from "./auth";
import { SignInSchema } from "./schema";
import { clearSessionCookie } from "@/utils/cookies";

export default router({
  // Server-only: callers must present verified identity claims, so the browser can never
  // supply a providerId directly. The web SSR sign-in routes call this with service credentials.
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
