import prisma from "@/database/prisma.ts";
import { cleanUserInput } from "@/utils/text.ts";
import type { CreateImageSchema, UpdateImageSchema } from "./schema.ts";
import { createTilePlacement } from "../tiles/tiles.ts";
import type { Prisma } from "@prisma/client";

export const IMAGE_FIELDS = {
  id: true,
  imageKey: true,
  caption: true,
  originX: true,
  originY: true,
} as const satisfies Prisma.ImageTileSelect;

export async function createImage({
  pageId,
  imageKey,
  caption,
}: CreateImageSchema) {
  return prisma.$transaction(async (transaction) => {
    const image = await transaction.imageTile.create({
      data: {
        imageKey,
        caption: caption ? cleanUserInput(caption) : null,
      },
      select: IMAGE_FIELDS,
    });
    const placement = await createTilePlacement(
      {
        pageId,
        type: "IMAGE",
        imageTileId: image.id,
      },
      transaction,
    );
    return { type: "IMAGE" as const, ...image, ...placement };
  });
}

export async function updateImage({ id, caption, origin }: UpdateImageSchema) {
  const image = await prisma.imageTile.update({
    where: {
      id,
    },
    data: {
      caption:
        typeof caption === "string" ? cleanUserInput(caption) : undefined,
      originX: origin?.x,
      originY: origin?.y,
    },
    select: IMAGE_FIELDS,
  });
  return { type: "IMAGE" as const, ...image };
}
