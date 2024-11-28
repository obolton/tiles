import { TileType, type Prisma } from "@prisma/client";
import type { CollectionTileSchema } from "./schema.ts";

export const COLLECTION_TILE_FIELDS = {
  id: true,
  type: true,
  title: true,
  items: {
    select: {
      id: true,
      position: true,
      image: {
        select: {
          imageKey: true,
          caption: true,
          originX: true,
          originY: true,
        },
      },
      video: {
        select: {
          videoType: true,
          videoId: true,
          imageUrl: true,
          title: true,
          description: true,
        },
      },
      text: {
        select: {
          content: true,
          theme: true,
          hue: true,
        },
      },
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
      link: {
        select: {
          url: true,
          title: true,
          description: true,
          siteName: true,
          imageUrl: true,
        },
      },
    },
    orderBy: {
      position: "asc",
    },
  },
} as const;

export async function createCollectionTile(
  tx: Prisma.TransactionClient,
  userId: string,
  pageId: string,
  { collection: { type, title, tileIds } }: CollectionTileSchema,
  position: number,
) {
  if (!tileIds || tileIds.length < 2) {
    throw new Error("Collection must have at least two tiles");
  }
  const parentTile = await tx.tile.findUniqueOrThrow({
    where: { id: tileIds[0] },
    select: { id: true, type: true, collection: { select: { id: true } } },
  });

  if (parentTile.collection) {
    return tx.collection.update({
      where: {
        id: parentTile.collection.id,
      },
      data: {
        items: {
          connect: {
            id: tileIds[1],
            // TODO: Position
          },
        },
      },
      select: COLLECTION_TILE_FIELDS,
    });
  }

  const collection = await tx.collection.create({
    data: {
      userId,
      type,
      title,
      items: {
        connect: tileIds.map((id) => ({ id })),
      },
    },
    select: {
      id: true,
    },
  });

  await Promise.all(
    tileIds.map((id, index) =>
      tx.tile.update({
        where: {
          id,
        },
        data: {
          parentCollectionId: collection.id,
          position: index,
        },
      }),
    ),
  );

  return tx.tile.create({
    data: {
      pageId,
      type: TileType.COLLECTION,
      position,
      columns: 1,
      rows: 1,
      collectionId: collection.id,
    },
    select: {
      id: true,
      type: true,
      position: true,
      columns: true,
      rows: true,
      collection: {
        select: COLLECTION_TILE_FIELDS,
      },
    },
  });
}

export async function updateCollectionTile(
  tx: Prisma.TransactionClient,
  id: string,
  { collection: { title } }: CollectionTileSchema,
) {
  return tx.tile.update({
    where: {
      id,
    },
    data: {
      collection: {
        update: {
          title,
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
      collection: {
        select: COLLECTION_TILE_FIELDS,
      },
    },
  });
}
