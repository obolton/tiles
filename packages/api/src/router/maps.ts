import { router, authenticatedProcedure } from "./trpc.ts";
import { addPlace, removePlace } from "@/models/maps/maps.ts";
import { AddPlaceSchema, RemovePlaceSchema } from "@/models/maps/schema.ts";

export default router({
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
