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
    orderBy: { name: "asc" },
  },
} as const satisfies Prisma.MapTileSelect;

export type Map = Prisma.MapTileGetPayload<{ select: typeof MAP_FIELDS }>;

export async function createMap({
  pageId,
  collectionId,
  width,
  height,
  place: { name, providerId, lat, long, boundingBox, address },
}: CreateMapSchema) {
  return prisma.$transaction(async (transaction) => {
    const map = await transaction.mapTile.create({
      data: {
        pageId,
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
        parentCollectionId: collectionId,
        type: "MAP",
        mapTileId: map.id,
        width,
        height,
      },
      transaction,
    );
    return { type: "MAP" as const, ...map, ...placement };
  });
}

export async function addPlace({ pageId, id, place }: AddPlaceSchema) {
  const { name, providerId, lat, long, boundingBox, address } = place;

  const map = await prisma.mapTile.update({
    where: { pageId, id },
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

export async function removePlace({ pageId, id, placeId }: RemovePlaceSchema) {
  return prisma.$transaction(async (transaction) => {
    await transaction.place.delete({
      where: { id: placeId, map: { pageId, id } },
      select: {
        id: true,
      },
    });
    const map = await transaction.mapTile.findUniqueOrThrow({
      where: { pageId, id },
      select: MAP_FIELDS,
    });
    return { type: "MAP" as const, ...map };
  });
}

export async function updatePlace({
  pageId,
  id,
  placeId,
  name,
}: UpdatePlaceSchema) {
  return prisma.$transaction(async (transaction) => {
    await prisma.place.update({
      where: { id: placeId, map: { pageId, id } },
      data: { name },
      select: { id: true },
    });
    const map = await transaction.mapTile.findUniqueOrThrow({
      where: { pageId, id },
      select: MAP_FIELDS,
    });
    return { type: "MAP" as const, ...map };
  });
}
