import { router } from "@/utils/trpc.ts";
import { pageUpdateProcedure } from "@/utils/middleware.ts";
import {
  createCollection,
  addToCollection,
  removeFromCollection,
} from "./collections.ts";
import {
  CreateCollectionSchema,
  AddToCollectionSchema,
  RemoveFromCollectionSchema,
} from "./schema.ts";

export default router({
  create: pageUpdateProcedure
    .input(CreateCollectionSchema)
    .mutation(({ input }) => createCollection(input)),

  addToCollection: pageUpdateProcedure
    .input(AddToCollectionSchema)
    .mutation(({ input }) => addToCollection(input)),

  removeFromCollection: pageUpdateProcedure
    .input(RemoveFromCollectionSchema)
    .mutation(({ input }) => removeFromCollection(input)),
});
