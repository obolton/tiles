import { UpdateUserSchema } from "@/models/users/schema.ts";
import { updateUser } from "@/models/users/users.ts";
import { router, authenticatedProcedure } from "./trpc.ts";

export default router({
  update: authenticatedProcedure
    .input(UpdateUserSchema)
    .mutation(async ({ input }) => {
      const user = await updateUser(input);
      return user;
    }),
});
