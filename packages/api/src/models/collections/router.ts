import { router, authenticatedProcedure } from "@/router/trpc.ts";
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
