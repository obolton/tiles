import { router, authenticatedProcedure } from "@/utils/trpc.ts";
import { SearchPlacesSchema } from "./schema.ts";
import { searchPlaces } from "./places.ts";

export default router({
  search: authenticatedProcedure
    .input(SearchPlacesSchema)
    .mutation(async ({ input }) => {
      const results = await searchPlaces(input);
      return results;
    }),
});
