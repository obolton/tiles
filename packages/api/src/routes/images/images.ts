import prisma, { type ExtensionArgs } from "@/database/prisma.ts";
import { createTilePlacement } from "../tiles/tiles.ts";
import type { CreateImageSchema, UpdateImageSchema } from "./schema.ts";
import type { Prisma } from "@prisma/client";

export const IMAGE_FIELDS = {
  id: true,
  imageUrl: true,
  text: true,
  originX: true,
  originY: true,
  theme: true,
} as const satisfies Prisma.ImageTileSelect<ExtensionArgs>;

export type Image = Prisma.Result<
  typeof prisma.imageTile,
  { select: typeof IMAGE_FIELDS },
  "findUniqueOrThrow"
>;

export async function createImage({
  pageId,
  sectionId,
  imageKey,
  text,
  theme,
}: CreateImageSchema) {
  return prisma.$transaction(async (transaction) => {
    const image = await transaction.imageTile.create({
      data: {
        pageId,
        imageKey,
        text,
        theme,
      },
      select: IMAGE_FIELDS,
    });
    const placement = await createTilePlacement(
      {
        pageId,
        sectionId,
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
  theme,
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
      theme,
    },
    select: IMAGE_FIELDS,
  });
  return { type: "IMAGE" as const, ...image };
}
