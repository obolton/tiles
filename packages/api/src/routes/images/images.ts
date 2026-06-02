import prisma from "@/database/prisma";
import { createTile } from "../tiles/tiles";
import type { CreateImageSchema } from "./schema";
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
