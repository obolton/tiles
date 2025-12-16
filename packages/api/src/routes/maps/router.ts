import { router } from "@/utils/trpc.ts";
import { pageUpdateProcedure } from "@/utils/middleware.ts";
import {
  createMap,
  addPlaces,
  removePlace,
  updatePlace,
  updateMap,
} from "./maps.ts";
import {
  CreateMapSchema,
  AddPlacesSchema,
  RemovePlaceSchema,
  UpdatePlaceSchema,
  UpdateMapSchema,
} from "./schema.ts";

export default router({
  create: pageUpdateProcedure
    .input(CreateMapSchema)
    .mutation(({ input }) => createMap(input)),

  update: pageUpdateProcedure
    .input(UpdateMapSchema)
    .mutation(({ input }) => updateMap(input)),

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
