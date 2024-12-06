import { router, authenticatedProcedure } from "@/utils/trpc.ts";
import { createMap, addPlace, removePlace } from "./maps.ts";
import {
  CreateMapSchema,
  AddPlaceSchema,
  RemovePlaceSchema,
} from "./schema.ts";
import { invalidateCachedPage } from "@/utils/cdn.ts";

export default router({
  create: authenticatedProcedure
    .input(CreateMapSchema)
    .mutation(async ({ input }) => {
      const map = await createMap(input);
      invalidateCachedPage(input.pageId);
      return map;
    }),

  addPlace: authenticatedProcedure
    .input(AddPlaceSchema)
    .mutation(async ({ input }) => {
      const result = await addPlace(input);
      return result;
    }),

  removePlace: authenticatedProcedure
    .input(RemovePlaceSchema)
    .mutation(async ({ input }) => {
      const result = await removePlace(input);
      return result;
    }),
});
