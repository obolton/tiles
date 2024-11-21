import { TRPCError } from "@trpc/server";
import { router, procedure } from "./trpc.ts";
import { addPlace, removePlace } from "@/models/maps/maps.ts";
import { AddPlaceSchema, RemovePlaceSchema } from "@/models/maps/schema.ts";

export default router({
  addPlace: procedure.input(AddPlaceSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    const result = await addPlace(input);
    return result;
  }),
  removePlace: procedure
    .input(RemovePlaceSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const result = await removePlace(input);
      return result;
    }),
});
