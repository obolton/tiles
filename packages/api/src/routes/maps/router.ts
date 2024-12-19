import { router } from "@/utils/trpc.ts";
import { pageUpdateProcedure } from "@/utils/middleware.ts";
import { createMap, addPlace, removePlace, updatePlace } from "./maps.ts";
import {
  CreateMapSchema,
  AddPlaceSchema,
  RemovePlaceSchema,
  UpdatePlaceSchema,
} from "./schema.ts";

export default router({
  create: pageUpdateProcedure
    .input(CreateMapSchema)
    .mutation(({ input }) => createMap(input)),

  addPlace: pageUpdateProcedure
    .input(AddPlaceSchema)
    .mutation(({ input }) => addPlace(input)),

  removePlace: pageUpdateProcedure
    .input(RemovePlaceSchema)
    .mutation(({ input }) => removePlace(input)),

  updatePlace: pageUpdateProcedure
    .input(UpdatePlaceSchema)
    .mutation(({ input }) => updatePlace(input)),
});
