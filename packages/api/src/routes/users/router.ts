import { router } from "@/utils/trpc.ts";
import { authenticatedProcedure } from "@/utils/middleware.ts";
import { UpdateUserSchema, IsUsernameAvailableSchema } from "./schema.ts";
import { getUserInfo, updateUser, isUsernameAvailable } from "./users.ts";

export default router({
  getUserInfo: authenticatedProcedure.query(({ ctx }) => getUserInfo(ctx)),

  update: authenticatedProcedure
    .input(UpdateUserSchema)
    .mutation(({ input, ctx }) => updateUser(input, ctx)),

  isUsernameAvailable: authenticatedProcedure
    .input(IsUsernameAvailableSchema)
    .query(({ input, ctx }) => isUsernameAvailable(input, ctx)),
});
