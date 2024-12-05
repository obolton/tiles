import { z } from "zod";
import {
  MIN_LATITUDE,
  MAX_LATITUDE,
  MIN_LONGITUDE,
  MAX_LONGITUDE,
} from "@/constants/geo.ts";

export const CreateMapSchema = z.object({
  pageId: z.string().uuid(),
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
  id: z.string().uuid(),
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
  id: z.string().uuid(),
  placeId: z.string().uuid(),
});
export type RemovePlaceSchema = z.infer<typeof RemovePlaceSchema>;
