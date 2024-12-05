import { router, authenticatedProcedure } from "@/router/trpc.ts";
import { UpdateUserSchema } from "./schema.ts";
import { updateUser } from "./users.ts";

export default router({
  update: authenticatedProcedure
    .input(UpdateUserSchema)
    .mutation(async ({ input }) => {
      const user = await updateUser(input);
      return user;
    }),
});
