import { router, procedure } from "./trpc.ts";
import { signIn, signOut } from "../models/users/auth.ts";
import { SignInSchema, SignOutSchema } from "../models/users/schema.ts";

export default router({
  signIn: procedure.input(SignInSchema).mutation(async ({ input }) => {
    const session = await signIn(input);
    return session;
  }),
  signOut: procedure.input(SignOutSchema).mutation(async ({ input }) => {
    await signOut(input);
    return null;
  }),
  getUserInfo: procedure.query(async ({ ctx }) => {
    return ctx.user;
  }),
});
