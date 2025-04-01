import prisma, { type ExtensionArgs } from "@/database/prisma.ts";
import type { CreateImageSchema, UpdateImageSchema } from "./schema.ts";
import { createTilePlacement } from "../tiles/tiles.ts";
import type { Prisma } from "@prisma/client";

export const IMAGE_FIELDS = {
  id: true,
  imageUrl: true,
  text: true,
  originX: true,
  originY: true,
} as const satisfies Prisma.ImageTileSelect<ExtensionArgs>;

export type Image = Prisma.Result<
  typeof prisma.imageTile,
  { select: typeof IMAGE_FIELDS },
  "findUniqueOrThrow"
>;

export async function createImage({
  pageId,
  collectionId,
  imageKey,
  text,
}: CreateImageSchema) {
  return prisma.$transaction(async (transaction) => {
    const image = await transaction.imageTile.create({
      data: {
        pageId,
        imageKey,
        text,
      },
      select: IMAGE_FIELDS,
    });
    const placement = await createTilePlacement(
      {
        pageId,
        parentCollectionId: collectionId,
        type: "IMAGE",
        imageTileId: image.id,
      },
      transaction,
    );
    return { type: "IMAGE" as const, ...image, ...placement };
  });
}

export async function updateImage({
  pageId,
  id,
  text,
  origin,
}: UpdateImageSchema) {
  const image = await prisma.imageTile.update({
    where: {
      pageId,
      id,
    },
    data: {
      text,
      originX: origin?.x,
      originY: origin?.y,
    },
    select: IMAGE_FIELDS,
  });
  return { type: "IMAGE" as const, ...image };
}
