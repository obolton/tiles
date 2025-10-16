import { z } from "zod";
import { PositionSchema } from "@/schema/Position.ts";
import {
  MIN_LATITUDE,
  MAX_LATITUDE,
  MIN_LONGITUDE,
  MAX_LONGITUDE,
} from "@/constants/geo.ts";

export const PlaceSchema = z.strictObject({
  name: z.string(),
  lat: z.number().gte(MIN_LATITUDE).lte(MAX_LATITUDE),
  long: z.number().gte(MIN_LONGITUDE).lte(MAX_LONGITUDE),
  boundingBox: z.array(z.number()).length(4).nullable(),
  address: z.string().nullable(),
  providerId: z.string().nullable(),
});
export type PlaceSchema = z.infer<typeof PlaceSchema>;

export const CreateMapSchema = z.strictObject({
  pageId: z.uuid(),
  sectionId: z.uuid(),
  ...PositionSchema.shape,
  places: z.array(PlaceSchema).min(1).max(20),
});
export type CreateMapSchema = z.infer<typeof CreateMapSchema>;

export const AddPlacesSchema = z.strictObject({
  pageId: z.uuid(),
  id: z.uuid(),
  places: z.array(PlaceSchema).min(1).max(20),
});
export type AddPlacesSchema = z.infer<typeof AddPlacesSchema>;

export const RemovePlaceSchema = z.strictObject({
  pageId: z.uuid(),
  id: z.uuid(),
  placeId: z.uuid(),
});
export type RemovePlaceSchema = z.infer<typeof RemovePlaceSchema>;

export const UpdatePlaceSchema = z.strictObject({
  pageId: z.uuid(),
  id: z.uuid(),
  place: PlaceSchema.partial().extend({
    id: z.uuid(),
  }),
});
export type UpdatePlaceSchema = z.infer<typeof UpdatePlaceSchema>;
