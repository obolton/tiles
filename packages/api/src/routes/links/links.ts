import prisma, { type ExtensionArgs } from "@/database/prisma.ts";
import { getLinkMetadata } from "@/utils/linkMetadata.ts";
import { getVideoInfo } from "@/utils/videos.ts";
import { createVideo } from "../videos/videos.ts";
import type { Prisma } from "@prisma/client";
import type { CreateLinkSchema, UpdateLinkSchema } from "./schema.ts";
import { createTilePlacement } from "../tiles/tiles.ts";

export const LINK_FIELDS = {
  id: true,
  url: true,
  title: true,
  description: true,
  siteName: true,
  imageUrl: true,
} as const satisfies Prisma.LinkTileSelect<ExtensionArgs>;

export async function createLink({ pageId, url }: CreateLinkSchema) {
  // Convert links to video tiles if they are video links
  const videoInfo = getVideoInfo(url);
  if (videoInfo) {
    return createVideo({
      pageId,
      url,
    });
  }

  return prisma.$transaction(async (transaction) => {
    const linkMetadata = await getLinkMetadata(url);
    const { title, description, siteName, imageUrl } = linkMetadata || {};
    const link = await transaction.linkTile.create({
      data: {
        url,
        title,
        description,
        siteName,
        originalImageUrl: imageUrl,
      },
      select: LINK_FIELDS,
    });
    const placement = await createTilePlacement(
      {
        pageId,
        type: "LINK",
        linkTileId: link.id,
      },
      transaction,
    );
    return {
      type: "LINK" as const,
      ...link,
      ...placement,
    };
  });
}

export async function updateLink({ id, url }: UpdateLinkSchema) {
  const linkMetadata = await getLinkMetadata(url);
  const { title, description, siteName, imageUrl } = linkMetadata || {};
  const link = await prisma.linkTile.update({
    where: {
      id,
    },
    data: {
      url,
      title,
      description,
      siteName,
      originalImageUrl: imageUrl,
    },
    select: LINK_FIELDS,
  });
  return {
    type: "LINK" as const,
    ...link,
  };
}

export async function getLinkTileOriginalImageUrl(id: string) {
  const link = await prisma.linkTile.findUnique({
    where: {
      id,
    },
    select: {
      originalImageUrl: true,
    },
  });
  return link?.originalImageUrl;
}
