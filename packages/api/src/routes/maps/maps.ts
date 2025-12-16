import prisma from "@/database/prisma";
import {
  AddPlacesSchema,
  RemovePlaceSchema,
  UpdatePlaceSchema,
  UpdateMapSchema,
} from "./schema";
import { createTile } from "../tiles/tiles";
import type { Prisma } from "@/generated/prisma/client";
import type { CreateMapSchema } from "./schema";

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

export async function createMap({
  pageId,
  places,
  style,
  ...properties
}: CreateMapSchema) {
  const { map, ...tile } = await createTile(
    {
      ...properties,
      pageId,
      type: "MAP",
      map: {
        pageId,
        style,
        places: {
          create: places.map(
            ({ name, providerId, lat, long, boundingBox, address }) => ({
              name,
              lat,
              long,
              boundingBox: boundingBox ?? [],
              address,
              providerId,
            }),
          ),
        },
      },
    },
    { map: { select: MAP_FIELDS } },
    prisma,
  );

  return { ...tile, ...map! };
}

export async function addPlaces({ pageId, id, places }: AddPlacesSchema) {
  const map = await prisma.mapTile.update({
    where: { pageId, id },
    data: {
      places: {
        create: places.map(
          ({ name, providerId, lat, long, boundingBox, address }) => ({
            name,
            lat,
            long,
            boundingBox: boundingBox ?? [],
            address,
            providerId,
          }),
        ),
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

export async function updatePlace({ pageId, id, place }: UpdatePlaceSchema) {
  const {
    id: placeId,
    name,
    lat,
    long,
    boundingBox,
    address,
    providerId,
  } = place;
  return prisma.$transaction(async (transaction) => {
    await prisma.place.update({
      where: { id: placeId, map: { pageId, id } },
      data: {
        name,
        lat,
        long,
        boundingBox: boundingBox === null ? [] : boundingBox,
        address,
        providerId,
      },
      select: { id: true },
    });
    const map = await transaction.mapTile.findUniqueOrThrow({
      where: { pageId, id },
      select: MAP_FIELDS,
    });
    return { type: "MAP" as const, ...map };
  });
}

export async function updateMap({ pageId, id, style }: UpdateMapSchema) {
  const map = await prisma.mapTile.update({
    where: { pageId, id },
    data: { style },
    select: MAP_FIELDS,
  });
  return { type: "MAP" as const, ...map };
}
