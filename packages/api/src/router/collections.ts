import { router, authenticatedProcedure } from "./trpc.ts";
import {
  createCollection,
  deleteCollection,
  addToCollection,
  removeFromCollection,
} from "@/models/collections/collections.ts";
import {
  CreateCollectionSchema,
  DeleteCollectionSchema,
  AddToCollectionSchema,
  RemoveFromCollectionSchema,
} from "@/models/collections/schema.ts";

export default router({
  create: authenticatedProcedure
    .input(CreateCollectionSchema)
    .mutation(async ({ ctx, input }) => {
      const collection = await createCollection(ctx.user.id, input);
      return collection;
    }),
  delete: authenticatedProcedure
    .input(DeleteCollectionSchema)
    .mutation(async ({ input }) => {
      const collection = await deleteCollection(input);
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
