import { router, authenticatedProcedure } from "./trpc.ts";
import {
  createCollection,
  addToCollection,
  removeFromCollection,
} from "@/models/collections/collections.ts";
import {
  CreateCollectionSchema,
  AddToCollectionSchema,
  RemoveFromCollectionSchema,
} from "@/models/collections/schema.ts";
import { invalidateCachedPage } from "@/utils/cdn.ts";

export default router({
  create: authenticatedProcedure
    .input(CreateCollectionSchema)
    .mutation(async ({ input, ctx }) => {
      const collection = await createCollection(input, ctx);
      invalidateCachedPage(input.pageId);
      return collection;
    }),

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
