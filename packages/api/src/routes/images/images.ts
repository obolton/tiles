import prisma, { type ExtensionArgs } from "@/database/prisma.ts";
import { cleanUserInput } from "@/utils/text.ts";
import type { CreateImageSchema, UpdateImageSchema } from "./schema.ts";
import { createTilePlacement } from "../tiles/tiles.ts";
import type { Prisma } from "@prisma/client";

export const IMAGE_FIELDS = {
  id: true,
  imageUrl: true,
  caption: true,
  originX: true,
  originY: true,
} as const satisfies Prisma.ImageTileSelect<ExtensionArgs>;

export type Image = Prisma.ImageTileGetPayload<{ select: typeof IMAGE_FIELDS }>;

export async function createImage({
  pageId,
  imageKey,
  caption,
}: CreateImageSchema) {
  return prisma.$transaction(async (transaction) => {
    const image = await transaction.imageTile.create({
      data: {
        pageId,
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

export async function updateImage({
  pageId,
  id,
  caption,
  origin,
}: UpdateImageSchema) {
  const image = await prisma.imageTile.update({
    where: {
      pageId,
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
