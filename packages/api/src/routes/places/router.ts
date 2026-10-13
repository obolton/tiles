import { router } from "@/utils/trpc";
import { authenticatedProcedure } from "@/utils/middleware";
import { SearchPlacesSchema } from "./schema";
import { searchPlaces } from "./places";

export default router({
  search: authenticatedProcedure
    .input(SearchPlacesSchema)
    .mutation(({ input }) => searchPlaces(input)),
});
