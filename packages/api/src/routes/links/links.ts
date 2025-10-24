import prisma, { type ExtensionArgs } from "@/database/prisma";
import { getLinkMetadata } from "@/utils/linkMetadata";
import { getVideoInfo } from "@/utils/videos";
import { createVideo } from "../videos/videos";
import type { Prisma } from "@/generated/prisma/client";
import type { CreateLinkSchema, UpdateLinkSchema } from "./schema";
import { createTile } from "../tiles/tiles";

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
  url,
  ...properties
}: CreateLinkSchema) {
  // Convert links to video tiles if they are video links
  const videoInfo = getVideoInfo(url);
  if (videoInfo) {
    return createVideo({
      ...properties,
      pageId,
      url,
    });
  }

  const linkMetadata = await getLinkMetadata(url);
  const { title, description, siteName, imageUrl } = linkMetadata || {};

  const { link, ...tile } = await createTile(
    {
      ...properties,
      type: "LINK",
      pageId,
      link: {
        pageId,
        url,
        title,
        description,
        siteName,
        originalImageUrl: imageUrl,
      },
    },
    { link: { select: LINK_FIELDS } },
    prisma,
  );

  return { ...tile, ...link };
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
