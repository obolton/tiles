import { router } from "@/utils/trpc.ts";
import { authenticatedProcedure } from "@/utils/middleware.ts";
import { UpdateUserSchema } from "./schema.ts";
import { updateUser } from "./users.ts";

export default router({
  update: authenticatedProcedure
    .input(UpdateUserSchema)
    .mutation(({ input, ctx }) => updateUser(input, ctx)),
});
