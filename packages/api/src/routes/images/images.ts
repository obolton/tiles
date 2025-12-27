import prisma, { type ExtensionArgs } from "@/database/prisma";
import { createTile } from "../tiles/tiles";
import type { CreateImageSchema, UpdateImageSchema } from "./schema";
import type { Prisma } from "@/generated/prisma/client";

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
  imageId,
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
