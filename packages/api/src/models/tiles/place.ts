import { TileType, type Prisma } from "@prisma/client";
import type { CreatePlaceTileSchema, UpdatePlaceTileSchema } from "./schema.ts";

export async function createPlaceTile(
  tx: Prisma.TransactionClient,
  {
    pageId,
    place: { name, providerId, lat, long, boundingBox, address },
  }: CreatePlaceTileSchema,
  position: number,
) {
  const placeTile = await tx.placeTile.create({
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
  return tx.tile.create({
    data: {
      pageId,
      type: TileType.PLACE,
      position,
      columns: 1,
      rows: 1,
      placeTileId: placeTile.id,
    },
    select: {
      id: true,
      type: true,
      position: true,
      columns: true,
      rows: true,
      place: {
        select: {
          name: true,
          providerId: true,
          lat: true,
          long: true,
          boundingBox: true,
          address: true,
        },
      },
    },
  });
}

export async function updatePlaceTile(
  tx: Prisma.TransactionClient,
  {
    id,
    place: { name, providerId, lat, long, boundingBox, address },
  }: UpdatePlaceTileSchema,
) {
  return tx.tile.update({
    where: {
      id,
    },
    data: {
      place: {
        update: {
          name,
          providerId,
          lat,
          long,
          boundingBox: boundingBox ?? [],
          address,
        },
      },
    },
    select: {
      id: true,
      pageId: true,
      type: true,
      position: true,
      columns: true,
      rows: true,
      place: {
        select: {
          name: true,
          providerId: true,
          lat: true,
          long: true,
          boundingBox: true,
          address: true,
        },
      },
    },
  });
}
