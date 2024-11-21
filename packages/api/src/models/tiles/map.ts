import { TileType, type Prisma } from "@prisma/client";
import type { MapTileSchema } from "./schema.ts";

export async function createMapTile(
  tx: Prisma.TransactionClient,
  pageId: string,
  {
    place: { name, providerId, lat, long, boundingBox, address },
  }: MapTileSchema,
  position: number,
) {
  const mapTile = await tx.mapTile.create({
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
    select: {
      id: true,
    },
  });
  return tx.tile.create({
    data: {
      pageId,
      type: TileType.MAP,
      position,
      columns: 1,
      rows: 1,
      mapTileId: mapTile.id,
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
}
