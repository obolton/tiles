import { router, authenticatedProcedure } from "./trpc.ts";
import {
  addToCollection,
  removeFromCollection,
} from "@/models/collections/collections.ts";
import {
  AddToCollectionSchema,
  RemoveFromCollectionSchema,
} from "@/models/collections/schema.ts";

export default router({
  addToCollection: authenticatedProcedure
    .input(AddToCollectionSchema)
    .mutation(async ({ input }) => {
      const result = await addToCollection(input);
      return result;
    }),

  removeFromCollection: authenticatedProcedure
    .input(RemoveFromCollectionSchema)
    .mutation(async ({ input }) => {
      const result = await removeFromCollection(input);
      return result;
    }),
});
