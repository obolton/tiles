import prisma from "@/database/prisma";
import { getLinkMetadata } from "@/utils/linkMetadata";
import { fetchImage } from "@/utils/fetchImage";
import { getVideoInfo } from "@/utils/videos";
import { createVideo } from "../videos/videos";
import type {
  CreateLinkSchema,
  GetLinkMetadataSchema,
  UpdateLinkSchema,
} from "./schema";
import { createTile } from "../tiles/tiles";
import { LINK_FIELDS } from "./fields";
import type { AuthenticatedPageProcedureContext } from "@/utils/middleware";

export type LinkMetadataResult =
  | {
      type: "VIDEO";
      videoType: "YOUTUBE";
      videoId: string;
      title: string;
      description: string | null;
      imageUrl: string | null;
    }
  | {
      type: "LINK";
      url: string;
      title: string | null;
      description: string | null;
      siteName: string | null;
      imageId: string | null;
    };

export async function resolveLinkMetadata(
  { url }: GetLinkMetadataSchema,
  ctx: AuthenticatedPageProcedureContext,
): Promise<LinkMetadataResult> {
  const videoInfo = getVideoInfo(url);
  const linkMetadata = await getLinkMetadata(url);
  const {
    title = null,
    description = null,
    siteName = null,
    imageUrl = null,
  } = linkMetadata ?? {};

  if (videoInfo) {
    return {
      type: "VIDEO",
      videoType: videoInfo.videoType,
      videoId: videoInfo.videoId,
      title: title ?? "",
      description,
      imageUrl,
    };
  }

  const imageId = imageUrl
    ? await fetchImage(imageUrl, ctx.workspaceId, ctx.userId)
    : null;

  return {
    type: "LINK",
    url,
    title,
    description,
    siteName,
    imageId,
  };
}

export async function createLink(
  { pageId, url, ...properties }: CreateLinkSchema,
  ctx: AuthenticatedPageProcedureContext,
) {
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

  const imageId = imageUrl
    ? await fetchImage(imageUrl, ctx.workspaceId, ctx.userId)
    : null;

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
        imageId,
      },
    },
    { link: { select: LINK_FIELDS } },
    prisma,
  );

  return { ...tile, ...link! };
}

export async function updateLink(
  { pageId, id, url }: UpdateLinkSchema,
  { workspaceId, userId }: AuthenticatedPageProcedureContext,
) {
  const linkMetadata = await getLinkMetadata(url);
  const { title, description, siteName, imageUrl } = linkMetadata || {};

  const imageId = imageUrl
    ? await fetchImage(imageUrl, workspaceId, userId)
    : null;

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
      imageId,
    },
    select: LINK_FIELDS,
  });
  return {
    type: "LINK" as const,
    ...link,
  };
}
