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
    const parentTile = await transaction.tile.findUniqueOrThrow({
      where: { id: tileIds[0] },
      select: { id: true, type: true, collection: { select: { id: true } } },
    });

    if (parentTile.collection) {
      return transaction.collection.update({
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
        select: COLLECTION_FIELDS,
      });
    }

    const collection = await transaction.collection.create({
      data: {
        title,
        items: {
          connect: tileIds.map((id) => ({ id })),
        },
      },
      select: COLLECTION_FIELDS,
    });

    await Promise.all(
      tileIds.map((id, index) =>
        transaction.tile.update({
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

    const placement = await createTilePlacement(
      {
        pageId,
        type: "COLLECTION",
        collectionId: collection.id,
      },
      transaction,
    );

    return { type: "COLLECTION" as const, ...collection, ...placement };
  });
}

export async function addToCollection({
  collectionId,
  tileId,
}: AddToCollectionSchema) {
  return prisma.$transaction(async (tx) => {
    const position = await tx.tile.count({
      where: { parentCollectionId: collectionId },
    });
    return await tx.collection.update({
      where: { id: collectionId },
      data: {
        items: {
          connect: {
            id: tileId,
            position,
          },
        },
      },
      select: COLLECTION_FIELDS,
    });
  });
}

export async function removeFromCollection({
  id,
  collectionId,
}: RemoveFromCollectionSchema) {
  return prisma.$transaction(async (tx) => {
    const { position } = await tx.tile.update({
      where: { id },
      data: { parentCollectionId: null },
      select: { position: true },
    });
    await tx.tile.updateMany({
      where: {
        parentCollectionId: collectionId,
        position: { gt: position },
      },
      data: { position: { decrement: 1 } },
    });
  });
}
