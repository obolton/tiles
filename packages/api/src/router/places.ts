import { TRPCError } from "@trpc/server";
import { router, procedure } from "./trpc.ts";
import { SearchPlacesSchema } from "@/utils/places/schema.ts";
import { searchPlaces } from "@/utils/places/search.ts";

export default router({
  search: procedure
    .input(SearchPlacesSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const results = await searchPlaces(input);
      return results;
    }),
});
