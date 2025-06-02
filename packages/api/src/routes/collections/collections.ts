import prisma, { type ExtensionArgs } from "@/database/prisma.ts";
import { createTilePlacement } from "../tiles/tiles.ts";
import type { Prisma } from "@prisma/client";
import type {
  CreateCollectionSchema,
  UpdateCollectionSchema,
} from "./schema.ts";
import { cleanSingleLineInput } from "@/utils/text.ts";

export const COLLECTION_FIELDS = {
  id: true,
  width: true,
  title: true,
  type: true,
} as const satisfies Prisma.CollectionSelect<ExtensionArgs>;

export async function createCollection({
  pageId,
  collectionId: parentCollectionId,
  type,
  width,
  title,
  tileIds = [],
}: CreateCollectionSchema) {
  return prisma.$transaction(async (transaction) => {
    if (tileIds.length > 0) {
      const validTiles = await transaction.tile.count({
        where: { pageId, id: { in: tileIds }, type: { not: "COLLECTION" } },
      });

      if (validTiles !== tileIds.length) {
        throw new Error("Invalid tiles");
      }
    }

    const { id: collectionId } = await transaction.collection.create({
      data: {
        pageId,
        type,
        width,
        title:
          typeof title === "string" ? cleanSingleLineInput(title) : undefined,
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
        parentCollectionId,
        collectionId,
      },
      transaction,
    );

    const collection = await transaction.collection.findUniqueOrThrow({
      where: { id: collectionId },
      select: COLLECTION_FIELDS,
    });

    return {
      ...collection,
      ...placement,
      type: "COLLECTION" as const,
    };
  });
}

export async function updateCollection({
  pageId,
  id,
  width,
  title,
}: UpdateCollectionSchema) {
  const collection = await prisma.collection.update({
    where: {
      pageId,
      id,
    },
    data: {
      width,
      title:
        typeof title === "string" ? cleanSingleLineInput(title) : undefined,
    },
    select: COLLECTION_FIELDS,
  });
  return collection;
}
