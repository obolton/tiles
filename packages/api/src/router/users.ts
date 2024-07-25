import { TRPCError } from "@trpc/server";
import { UpdateUserSchema } from "@/models/users/schema.ts";
import { updateUser } from "@/models/users/users.ts";
import { router, procedure } from "./trpc.ts";

export default router({
  update: procedure.input(UpdateUserSchema).mutation(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    const user = await updateUser(input);
    return user;
  }),
});
