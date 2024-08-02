import { getLinkMetadata } from "../../utils/linkMetadata.ts";
import prisma from "@/database/prisma.ts";
import { getLinkImageUrl } from "@/utils/cdn.ts";
import type { Prisma } from "@prisma/client";
import type { CreateLinkTileSchema, UpdateLinkTileSchema } from "./schema.ts";

export async function createLinkTile(
  db: Prisma.TransactionClient,
  { pageId, link: { url } }: CreateLinkTileSchema,
  position: number,
) {
  const linkMetadata = await getLinkMetadata(url);
  const { title, description, siteName, imageUrl } = linkMetadata || {};
  const tile = await db.tile.create({
    data: {
      pageId,
      type: "LINK",
      position,
      columns: 1,
      rows: 1,
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
      position: true,
      columns: true,
      rows: true,
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
  return {
    ...tile,
    link: {
      ...tile.link!,
      imageUrl: tile.link!.imageUrl ? getLinkImageUrl(tile.id) : null,
    },
  };
}

export async function updateLinkTile(
  db: Prisma.TransactionClient,
  { id, link: { url } }: UpdateLinkTileSchema,
) {
  const linkMetadata = await getLinkMetadata(url);
  const { title, description, siteName, imageUrl } = linkMetadata || {};
  const tile = await db.tile.update({
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
      position: true,
      columns: true,
      rows: true,
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
  return {
    ...tile,
    link: {
      ...tile.link!,
      imageUrl: tile.link!.imageUrl ? getLinkImageUrl(tile.id) : null,
    },
  };
}

export async function getLinkTileImageUrl(id: string) {
  const tile = await prisma.tile.findUnique({
    where: {
      id,
    },
    select: {
      link: {
        select: {
          imageUrl: true,
        },
      },
    },
  });
  return tile?.link?.imageUrl;
}
