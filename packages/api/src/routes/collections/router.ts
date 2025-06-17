import { router } from "@/utils/trpc.ts";
import { pageUpdateProcedure } from "@/utils/middleware.ts";
import { updateCollection } from "./collections.ts";
import { UpdateCollectionSchema } from "./schema.ts";

export default router({
  update: pageUpdateProcedure
    .input(UpdateCollectionSchema)
    .mutation(({ input }) => updateCollection(input)),
});
