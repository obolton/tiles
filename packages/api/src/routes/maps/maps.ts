import prisma from "@/database/prisma.ts";
import {
  AddPlacesSchema,
  RemovePlaceSchema,
  UpdatePlaceSchema,
} from "./schema.ts";
import { createTilePlacement } from "../tiles/tiles.ts";
import type { Prisma } from "@/generated/prisma/client";
import type { CreateMapSchema } from "./schema.ts";

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
  places: {
    select: PLACE_FIELDS,
    orderBy: { name: "asc" },
  },
} as const satisfies Prisma.MapTileSelect;

export type Map = Prisma.MapTileGetPayload<{ select: typeof MAP_FIELDS }>;

export async function createMap({
  pageId,
  sectionId,
  width,
  height,
  rowSpan,
  x,
  y,
  block,
  places,
}: CreateMapSchema) {
  return prisma.$transaction(async (transaction) => {
    const map = await transaction.mapTile.create({
      data: {
        pageId,
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
    const placement = await createTilePlacement(
      {
        pageId,
        sectionId,
        type: "MAP",
        mapTileId: map.id,
        width,
        height,
        rowSpan,
        x,
        y,
        block,
      },
      transaction,
    );
    return { type: "MAP" as const, ...map, ...placement };
  });
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
