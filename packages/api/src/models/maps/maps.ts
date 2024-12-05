import prisma from "@/database/prisma.ts";
import { AddPlaceSchema, RemovePlaceSchema } from "./schema.ts";
import type { Prisma } from "@prisma/client";
import { createTilePlacement } from "../tiles/tiles.ts";
import type { CreateMapSchema } from "./schema.ts";

export const MAP_FIELDS: Prisma.MapTileSelect = {
  id: true,
  places: {
    select: {
      id: true,
      name: true,
      providerId: true,
      lat: true,
      long: true,
      boundingBox: true,
      address: true,
    },
  },
};

export async function createMap({
  pageId,
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
      },
      transaction,
    );
    return { type: "MAP", ...map, ...placement };
  });
}

export async function addPlace({ id, place }: AddPlaceSchema) {
  const { name, providerId, lat, long, boundingBox, address } = place;
  return prisma.$transaction(async (tx) => {
    return tx.mapTile.update({
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
  });
}

export async function removePlace({ id, placeId }: RemovePlaceSchema) {
  return prisma.$transaction(async (tx) => {
    await tx.place.delete({
      where: { id: placeId },
      select: {
        id: true,
      },
    });
    return tx.mapTile.findUniqueOrThrow({
      where: { id },
      select: MAP_FIELDS,
    });
  });
}
