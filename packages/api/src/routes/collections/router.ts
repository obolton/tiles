import { router } from "@/utils/trpc.ts";
import { pageUpdateProcedure } from "@/utils/middleware.ts";
import { createCollection } from "./collections.ts";
import { CreateCollectionSchema } from "./schema.ts";

export default router({
  create: pageUpdateProcedure
    .input(CreateCollectionSchema)
    .mutation(({ input }) => createCollection(input)),
});
