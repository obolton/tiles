import prisma from "@/database/prisma.ts";
import { AddPlaceSchema, RemovePlaceSchema } from "./schema.ts";

export async function addPlace({ id, place }: AddPlaceSchema) {
  const { name, providerId, lat, long, boundingBox, address } = place;
  return prisma.$transaction(async (tx) => {
    const placeTile = await tx.place.create({
      data: {
        name,
        providerId,
        lat,
        long,
        boundingBox: boundingBox ?? [],
        address,
      },
      select: {
        id: true,
      },
    });
    return tx.tile.update({
      where: { id },
      data: {
        map: {
          update: {
            places: {
              connect: {
                id: placeTile.id,
              },
            },
          },
        },
      },
      select: {
        id: true,
        type: true,
        position: true,
        columns: true,
        rows: true,
        map: {
          select: {
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
          },
        },
      },
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
    return tx.tile.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        type: true,
        position: true,
        columns: true,
        rows: true,
        map: {
          select: {
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
          },
        },
      },
    });
  });
}
