import { router } from "@/utils/trpc.ts";
import { authenticatedProcedure } from "@/utils/middleware.ts";
import { SearchPlacesSchema } from "./schema.ts";
import { searchPlaces } from "./places.ts";

export default router({
  search: authenticatedProcedure
    .input(SearchPlacesSchema)
    .mutation(({ input }) => searchPlaces(input)),
});
