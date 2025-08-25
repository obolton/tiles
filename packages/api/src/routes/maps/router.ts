import { router } from "@/utils/trpc.ts";
import { pageUpdateProcedure } from "@/utils/middleware.ts";
import { createMap, addPlaces, removePlace, updatePlace } from "./maps.ts";
import {
  CreateMapSchema,
  AddPlacesSchema,
  RemovePlaceSchema,
  UpdatePlaceSchema,
} from "./schema.ts";

export default router({
  create: pageUpdateProcedure
    .input(CreateMapSchema)
    .mutation(({ input }) => createMap(input)),

  addPlaces: pageUpdateProcedure
    .input(AddPlacesSchema)
    .mutation(({ input }) => addPlaces(input)),

  removePlace: pageUpdateProcedure
    .input(RemovePlaceSchema)
    .mutation(({ input }) => removePlace(input)),

  updatePlace: pageUpdateProcedure
    .input(UpdatePlaceSchema)
    .mutation(({ input }) => updatePlace(input)),
});
