import prisma from "@/database/prisma.ts";
import type {
  AddToCollectionSchema,
  RemoveFromCollectionSchema,
} from "./schema.ts";
import type { Prisma } from "@prisma/client";
import type { CreateCollectionSchema } from "./schema.ts";
import { createTilePlacement } from "../tiles/tiles.ts";
import { TEXT_FIELDS } from "../text/text.ts";
import { IMAGE_FIELDS } from "../images/images.ts";
import { MAP_FIELDS } from "../maps/maps.ts";
import { VIDEO_FIELDS } from "../videos/videos.ts";
import { LINK_FIELDS } from "../links/links.ts";
import { PAGE_LINK_FIELDS } from "../pageLinks/pageLinks.ts";
import { EVENT_FIELDS } from "../events/events.ts";
import { formatTile } from "../pages/pages.ts";

export const COLLECTION_FIELDS = {
  id: true,
  title: true,
  items: {
    select: {
      id: true,
      type: true,
      columns: true,
      rows: true,
      position: true,
      image: {
        select: IMAGE_FIELDS,
      },
      video: {
        select: VIDEO_FIELDS,
      },
      text: {
        select: TEXT_FIELDS,
      },
      map: {
        select: MAP_FIELDS,
      },
      link: {
        select: LINK_FIELDS,
      },
      pageLink: {
        select: PAGE_LINK_FIELDS,
      },
      event: {
        select: EVENT_FIELDS,
      },
    },
    orderBy: {
      position: "asc",
    },
  },
} as const satisfies Prisma.CollectionSelect;

export async function createCollection({
  pageId,
  title,
  tileIds,
}: CreateCollectionSchema) {
  if (!tileIds || tileIds.length < 2) {
    throw new Error("Collection must have at least two tiles");
  }

  return prisma.$transaction(async (transaction) => {
    const validTiles = await transaction.tile.count({
      where: { pageId, id: { in: tileIds }, type: { not: "COLLECTION" } },
    });

    if (validTiles !== tileIds.length) {
      throw new Error("Invalid tiles");
    }

    const { id: collectionId } = await transaction.collection.create({
      data: {
        pageId,
        title,
      },
      select: { id: true },
    });

    await Promise.all(
      tileIds.map((id, index) =>
        transaction.tile.update({
          where: {
            pageId,
            id,
          },
          data: {
            parentCollectionId: collectionId,
            position: index,
          },
        }),
      ),
    );

    const placement = await createTilePlacement(
      {
        pageId,
        type: "COLLECTION",
        collectionId,
      },
      transaction,
    );

    const collection = await transaction.collection.findUniqueOrThrow({
      where: { id: collectionId },
      select: COLLECTION_FIELDS,
    });

    return {
      type: "COLLECTION" as const,
      ...collection,
      // @ts-expect-error Incompatibility due to collections missing
      items: collection.items.map(formatTile),
      ...placement,
    };
  });
}

export async function addToCollection({
  pageId,
  collectionId,
  tileId,
  position,
}: AddToCollectionSchema) {
  return prisma.$transaction(async (transaction) => {
    const { parentCollectionId: oldCollectionId, position: oldPosition } =
      await transaction.tile.findUniqueOrThrow({
        where: { pageId, id: tileId },
        select: { parentCollectionId: true, position: true },
      });

    if (oldCollectionId === collectionId) {
      throw new Error("Tile is already in collection");
    }

    const collectionSize = await transaction.tile.count({
      where: { pageId, parentCollectionId: collectionId },
    });

    if (position > collectionSize) {
      throw new Error(`Invalid position: ${position}`);
    }

    await Promise.all([
      // Remove position from old collection
      transaction.tile.updateMany({
        where: {
          id: { not: tileId },
          pageId,
          parentCollectionId: oldCollectionId,
          position: { gt: oldPosition },
        },
        data: { position: { decrement: 1 } },
      }),

      // Create space in new collection
      transaction.tile.updateMany({
        where: {
          id: { not: tileId },
          pageId,
          parentCollectionId: collectionId,
          position: { gte: position },
        },
        data: { position: { increment: 1 } },
      }),

      // Move item to collection
      transaction.tile.update({
        where: {
          pageId,
          id: tileId,
        },
        data: {
          parentCollectionId: collectionId,
          position,
        },
      }),
    ]);

    const collection = await transaction.collection.findUniqueOrThrow({
      where: { pageId, id: collectionId },
      select: COLLECTION_FIELDS,
    });

    return {
      type: "COLLECTION" as const,
      ...collection,
      // @ts-expect-error Incompatibility due to collections missing
      items: collection.items.map(formatTile),
    };
  });
}

export async function removeFromCollection({
  pageId,
  id,
  collectionId,
  position,
}: RemoveFromCollectionSchema) {
  return prisma.$transaction(async (transaction) => {
    const rootSize = await transaction.tile.count({
      where: { pageId, parentCollectionId: null },
    });
    if (position >= rootSize) {
      throw new Error(`Invalid position: ${position}`);
    }
    const { position: oldPosition } = await transaction.tile.findUniqueOrThrow({
      where: { pageId, id },
      select: { position: true },
    });
    await Promise.all([
      // Remove position from old collection
      transaction.tile.updateMany({
        where: {
          id: { not: id },
          pageId,
          parentCollectionId: collectionId,
          position: { gt: oldPosition },
        },
        data: { position: { decrement: 1 } },
      }),

      // Create space in root
      transaction.tile.updateMany({
        where: {
          id: { not: id },
          pageId,
          parentCollectionId: null,
          position: { gte: position },
        },
        data: { position: { increment: 1 } },
      }),

      // Move item to collection
      transaction.tile.update({
        where: { pageId, id },
        data: { parentCollectionId: null, position },
        select: { id: true },
      }),
    ]);

    const collection = await transaction.collection.findUniqueOrThrow({
      where: { pageId, id: collectionId },
      select: COLLECTION_FIELDS,
    });

    return {
      type: "COLLECTION" as const,
      ...collection,
      // @ts-expect-error Incompatibility due to collections missing
      items: collection.items.map(formatTile),
    };
  });
}
