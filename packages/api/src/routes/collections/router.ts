import { router } from "@/utils/trpc.ts";
import { pageUpdateProcedure } from "@/utils/middleware.ts";
import { createCollection, updateCollection } from "./collections.ts";
import { CreateCollectionSchema, UpdateCollectionSchema } from "./schema.ts";

export default router({
  create: pageUpdateProcedure
    .input(CreateCollectionSchema)
    .mutation(({ input }) => createCollection(input)),

  update: pageUpdateProcedure
    .input(UpdateCollectionSchema)
    .mutation(({ input }) => updateCollection(input)),
});
