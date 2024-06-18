import { randomUUID } from "node:crypto";
import { TileType, type Prisma } from "@prisma/client";
import type { CreatePlaceTileSchema, UpdatePlaceTileSchema } from "./schema.ts";
import { getStaticMap } from "../../utils/maps.ts";
import { upload } from "../../utils/storage.ts";

const MAPS_BUCKET = process.env.CLOUDFLARE_R2_BUCKET_MAPS;

export async function createPlaceTile(
  tx: Prisma.TransactionClient,
  {
    pageId,
    place: { name, providerId, lat, long, boundingBox, address },
  }: CreatePlaceTileSchema,
  position: number
) {
  if (!MAPS_BUCKET) {
    throw new Error(
      "CLOUDFLARE_R2_BUCKET_MAPS environment variable is undefined"
    );
  }
  const { stream, contentType } = await getStaticMap({
    width: 300,
    height: 300,
    lat,
    long,
    boundingBox,
  });
  const thumbnailKey = randomUUID();
  await upload(MAPS_BUCKET, thumbnailKey, stream, contentType);
  return tx.tile.create({
    data: {
      pageId,
      type: TileType.PLACE,
      position,
      place: {
        create: {
          name,
          providerId,
          lat,
          long,
          boundingBox: boundingBox ?? [],
          address,
          thumbnailKey,
        },
      },
    },
    select: {
      id: true,
      type: true,
      place: {
        select: {
          name: true,
          providerId: true,
          lat: true,
          long: true,
          boundingBox: true,
          address: true,
          thumbnailKey: true,
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
  }: UpdatePlaceTileSchema
) {
  if (!MAPS_BUCKET) {
    throw new Error(
      "CLOUDFLARE_R2_BUCKET_MAPS environment variable is undefined"
    );
  }
  const { stream, contentType } = await getStaticMap({
    width: 300,
    height: 300,
    lat,
    long,
    boundingBox,
  });
  const thumbnailKey = randomUUID();
  await upload(MAPS_BUCKET, thumbnailKey, stream, contentType);
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
          thumbnailKey,
        },
      },
    },
    select: {
      id: true,
      type: true,
      place: {
        select: {
          name: true,
          providerId: true,
          lat: true,
          long: true,
          boundingBox: true,
          address: true,
          thumbnailKey: true,
        },
      },
    },
  });
}
