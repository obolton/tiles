import { router } from "@/utils/trpc";
import { authenticatedProcedure } from "@/utils/middleware";
import { UpdateUserSchema, IsUsernameAvailableSchema } from "./schema";
import { getUserInfo, updateUser, isUsernameAvailable } from "./users";

export default router({
  getUserInfo: authenticatedProcedure.query(({ ctx }) => getUserInfo(ctx)),

  update: authenticatedProcedure
    .input(UpdateUserSchema)
    .mutation(({ input, ctx }) => updateUser(input, ctx)),

  isUsernameAvailable: authenticatedProcedure
    .input(IsUsernameAvailableSchema)
    .query(({ input, ctx }) => isUsernameAvailable(input, ctx)),
});
