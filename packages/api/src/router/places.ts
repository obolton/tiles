import { router, authenticatedProcedure } from "./trpc.ts";
import { SearchPlacesSchema } from "@/utils/places/schema.ts";
import { searchPlaces } from "@/utils/places/search.ts";

export default router({
  search: authenticatedProcedure
    .input(SearchPlacesSchema)
    .mutation(async ({ input }) => {
      const results = await searchPlaces(input);
      return results;
    }),
});
