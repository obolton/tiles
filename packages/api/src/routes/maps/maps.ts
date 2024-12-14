import prisma from "@/database/prisma.ts";
import {
  AddPlaceSchema,
  RemovePlaceSchema,
  UpdatePlaceSchema,
} from "./schema.ts";
import type { Prisma } from "@prisma/client";
import { createTilePlacement } from "../tiles/tiles.ts";
import type { CreateMapSchema } from "./schema.ts";

export const PLACE_FIELDS = {
  id: true,
  name: true,
  providerId: true,
  lat: true,
  long: true,
  boundingBox: true,
  address: true,
} as const satisfies Prisma.PlaceSelect;

export const MAP_FIELDS = {
  id: true,
  places: {
    select: PLACE_FIELDS,
  },
} as const satisfies Prisma.MapTileSelect;

export type Map = Prisma.MapTileGetPayload<{ select: typeof MAP_FIELDS }>;

export async function createMap({
  pageId,
  columns,
  rows,
  place: { name, providerId, lat, long, boundingBox, address },
}: CreateMapSchema) {
  return prisma.$transaction(async (transaction) => {
    const map = await transaction.mapTile.create({
      data: {
        places: {
          create: {
            name,
            providerId,
            lat,
            long,
            boundingBox: boundingBox ?? [],
            address,
          },
        },
      },
      select: MAP_FIELDS,
    });
    const placement = await createTilePlacement(
      {
        pageId,
        type: "MAP",
        mapTileId: map.id,
        columns,
        rows,
      },
      transaction,
    );
    return { type: "MAP" as const, ...map, ...placement };
  });
}

export async function addPlace({ id, place }: AddPlaceSchema) {
  const { name, providerId, lat, long, boundingBox, address } = place;

  const map = await prisma.mapTile.update({
    where: { id },
    data: {
      places: {
        create: {
          name,
          providerId,
          lat,
          long,
          boundingBox: boundingBox ?? [],
          address,
        },
      },
    },
    select: MAP_FIELDS,
  });
  return { type: "MAP" as const, ...map };
}

export async function removePlace({ id, placeId }: RemovePlaceSchema) {
  return prisma.$transaction(async (tx) => {
    await tx.place.delete({
      where: { id: placeId },
      select: {
        id: true,
      },
    });
    const map = await tx.mapTile.findUniqueOrThrow({
      where: { id },
      select: MAP_FIELDS,
    });
    return { type: "MAP" as const, ...map };
  });
}

export async function updatePlace({ id, name }: UpdatePlaceSchema) {
  return prisma.place.update({
    where: { id },
    data: { name },
    select: PLACE_FIELDS,
  });
}
