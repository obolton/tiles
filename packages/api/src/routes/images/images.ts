import prisma from "@/database/prisma";
import { createTile } from "../tiles/tiles";
import type { CreateImageSchema, UpdateImageSchema } from "./schema";
import { IMAGE_FIELDS } from "./fields";

export async function createImage({
  pageId,
  imageId,
  alt,
  text,
  ...properties
}: CreateImageSchema) {
  const { image, ...tile } = await createTile(
    {
      ...properties,
      type: "IMAGE",
      pageId,
      image: {
        pageId,
        imageId,
        alt,
        text,
      },
    },
    { image: { select: IMAGE_FIELDS } },
    prisma,
  );

  return { ...tile, ...image! };
}

export async function updateImage({
  pageId,
  id,
  alt,
  text,
  origin,
}: UpdateImageSchema) {
  const image = await prisma.imageTile.update({
    where: {
      pageId,
      id,
    },
    data: {
      alt,
      text,
      originX: origin?.x,
      originY: origin?.y,
    },
    select: IMAGE_FIELDS,
  });
  return { type: "IMAGE" as const, ...image };
}
