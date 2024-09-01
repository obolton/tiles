import { TileType, type Prisma } from "@prisma/client";
import type {
  CreateCollectionTileSchema,
  UpdateCollectionTileSchema,
} from "./schema.ts";

export async function createCollectionTile(
  tx: Prisma.TransactionClient,
  userId: string,
  { pageId, collection: { title, tileIds } }: CreateCollectionTileSchema,
  position: number,
) {
  const tiles = await tx.tile.findMany({
    select: {
      imageTileId: true,
      videoTileId: true,
      textTileId: true,
      placeTileId: true,
      linkTileId: true,
      pageLinkTileId: true,
      eventTileId: true,
    },
    where: {
      id: {
        in: tileIds,
      },
    },
  });
  const collection = await tx.collection.create({
    data: {
      userId,
      title,
      items: {
        create: tiles.map((tile, index) => ({ ...tile, position: index })),
      },
    },
    select: {
      id: true,
    },
  });
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
        select: {
          id: true,
          title: true,
        },
      },
    },
  });
}

export async function updateCollectionTile(
  tx: Prisma.TransactionClient,
  { id, collection: { title } }: UpdateCollectionTileSchema,
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
        select: {
          title: true,
        },
      },
    },
  });
}
