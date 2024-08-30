import { TRPCError } from "@trpc/server";
import { router, procedure } from "./trpc.ts";
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
  create: procedure
    .input(CreateCollectionSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const collection = await createCollection(ctx.user.id, input);
      return collection;
    }),
  delete: procedure
    .input(DeleteCollectionSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const collection = await deleteCollection(input);
      return collection;
    }),
  addToCollection: procedure
    .input(AddToCollectionSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const result = await addToCollection(input);
      return result;
    }),
  removeFromCollection: procedure
    .input(RemoveFromCollectionSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const result = await removeFromCollection(input);
      return result;
    }),
});
