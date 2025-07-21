import { z } from "zod";
import {
  MIN_LATITUDE,
  MAX_LATITUDE,
  MIN_LONGITUDE,
  MAX_LONGITUDE,
} from "@/constants/geo.ts";

export const CreateMapSchema = z.object({
  pageId: z.uuid(),
  sectionId: z.uuid(),
  width: z.number().int().gte(4).lte(12).optional(),
  height: z.number().int().gte(4).lte(24).optional(),
  place: z.object({
    name: z.string(),
    providerId: z.string().nullable(),
    lat: z.number().gte(MIN_LATITUDE).lte(MAX_LATITUDE),
    long: z.number().gte(MIN_LONGITUDE).lte(MAX_LONGITUDE),
    boundingBox: z.array(z.number()).length(4).nullable(),
    address: z.string().nullable(),
  }),
});
export type CreateMapSchema = z.infer<typeof CreateMapSchema>;

export const AddPlaceSchema = z.object({
  pageId: z.uuid(),
  id: z.uuid(),
  place: z.object({
    name: z.string(),
    providerId: z.string().nullable(),
    lat: z.number().gte(MIN_LATITUDE).lte(MAX_LATITUDE),
    long: z.number().gte(MIN_LONGITUDE).lte(MAX_LONGITUDE),
    boundingBox: z.array(z.number()).length(4).nullable(),
    address: z.string().nullable(),
  }),
});
export type AddPlaceSchema = z.infer<typeof AddPlaceSchema>;

export const RemovePlaceSchema = z.object({
  pageId: z.uuid(),
  id: z.uuid(),
  placeId: z.uuid(),
});
export type RemovePlaceSchema = z.infer<typeof RemovePlaceSchema>;

export const UpdatePlaceSchema = z.object({
  pageId: z.uuid(),
  id: z.uuid(),
  placeId: z.uuid(),
  name: z.string(),
});
export type UpdatePlaceSchema = z.infer<typeof UpdatePlaceSchema>;
