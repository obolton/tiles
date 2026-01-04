import type { Prisma } from "@/generated/prisma/client";

export const PLACE_FIELDS = {
  id: true,
  name: true,
  lat: true,
  long: true,
  boundingBox: true,
  address: true,
  providerId: true,
} as const satisfies Prisma.PlaceSelect;

export const MAP_FIELDS = {
  id: true,
  style: true,
  places: {
    select: PLACE_FIELDS,
    orderBy: { name: "asc" },
  },
} as const satisfies Prisma.MapTileSelect;

export type Map = Prisma.MapTileGetPayload<{ select: typeof MAP_FIELDS }>;
