import prisma, { type ExtensionArgs } from "@/database/prisma.ts";
import { getLinkMetadata } from "@/utils/linkMetadata.ts";
import { getVideoInfo } from "@/utils/videos.ts";
import { createVideo } from "../videos/videos.ts";
import type { Prisma } from "@/generated/prisma/client";
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

export async function createLink({
  pageId,
  sectionId,
  url,
  width,
  height,
  rowSpan,
  x,
  y,
  block,
}: CreateLinkSchema) {
  // Convert links to video tiles if they are video links
  const videoInfo = getVideoInfo(url);
  if (videoInfo) {
    return createVideo({
      pageId,
      sectionId,
      url,
    });
  }

  return prisma.$transaction(async (transaction) => {
    const linkMetadata = await getLinkMetadata(url);
    const { title, description, siteName, imageUrl } = linkMetadata || {};
    const link = await transaction.linkTile.create({
      data: {
        pageId,
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
        sectionId,
        type: "LINK",
        linkTileId: link.id,
        width,
        height,
        rowSpan,
        x,
        y,
        block,
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

export async function updateLink({ pageId, id, url }: UpdateLinkSchema) {
  const linkMetadata = await getLinkMetadata(url);
  const { title, description, siteName, imageUrl } = linkMetadata || {};
  const link = await prisma.linkTile.update({
    where: {
      pageId,
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
