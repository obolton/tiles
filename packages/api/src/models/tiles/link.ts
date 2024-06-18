import { getLinkMetadata } from "../../utils/linkMetadata.ts";
import type { Prisma } from "@prisma/client";
import type { CreateLinkTileSchema, UpdateLinkTileSchema } from "./schema.ts";

export async function createLinkTile(
  db: Prisma.TransactionClient,
  { pageId, link: { url } }: CreateLinkTileSchema,
  position: number
) {
  const linkMetadata = await getLinkMetadata(url);
  const { title, description, siteName, imageUrl } = linkMetadata || {};
  return db.tile.create({
    data: {
      pageId,
      type: "LINK",
      position,
      link: {
        create: {
          url,
          title,
          description,
          siteName,
          imageUrl,
        },
      },
    },
    select: {
      id: true,
      type: true,
      link: {
        select: {
          url: true,
          title: true,
          description: true,
          siteName: true,
          imageUrl: true,
        },
      },
    },
  });
}

export async function updateLinkTile(
  db: Prisma.TransactionClient,
  { id, link: { url } }: UpdateLinkTileSchema
) {
  const linkMetadata = await getLinkMetadata(url);
  const { title, description, siteName, imageUrl } = linkMetadata || {};
  return db.tile.update({
    where: {
      id,
    },
    data: {
      link: {
        update: {
          url,
          title,
          description,
          siteName,
          imageUrl,
        },
      },
    },
    select: {
      id: true,
      type: true,
      link: {
        select: {
          url: true,
          title: true,
          description: true,
          siteName: true,
          imageUrl: true,
        },
      },
    },
  });
}
