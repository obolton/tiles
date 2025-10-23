import prisma, { type ExtensionArgs } from "@/database/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { getLinkMetadata } from "@/utils/linkMetadata";
import { getVideoInfo } from "@/utils/videos";
import type { CreateVideoSchema, UpdateVideoSchema } from "./schema";
import { createTile } from "../tiles/tiles";

export const VIDEO_FIELDS = {
  id: true,
  videoType: true,
  videoId: true,
  imageUrl: true,
  title: true,
  description: true,
} as const satisfies Prisma.VideoTileSelect<ExtensionArgs>;

export async function createVideo({
  pageId,
  sectionId,
  url,
  ...properties
}: CreateVideoSchema) {
  const videoInfo = getVideoInfo(url);
  if (!videoInfo) {
    throw new Error("Invalid video URL");
  }
  const { videoType, videoId } = videoInfo;
  const linkMetadata = await getLinkMetadata(url);
  const { title, description, imageUrl } = linkMetadata || {};

  const { video, ...tile } = await createTile(
    {
      ...properties,
      type: "VIDEO",
      pageId,
      sectionId,
      video: {
        pageId,
        videoType,
        videoId,
        originalImageUrl: imageUrl,
        title: title?.trim() ?? "",
        description: description?.trim() || null,
      },
    },
    { video: { select: VIDEO_FIELDS } },
    prisma,
  );

  return { ...tile, ...video };
}

export async function updateVideo({ pageId, id, title }: UpdateVideoSchema) {
  const video = await prisma.videoTile.update({
    where: {
      pageId,
      id,
    },
    data: {
      title: title?.trim() ?? "",
    },
    select: VIDEO_FIELDS,
  });
  return {
    type: "VIDEO" as const,
    ...video,
  };
}

export async function getVideoTileOriginalImageUrl(id: string) {
  const video = await prisma.videoTile.findUnique({
    where: {
      id,
    },
    select: {
      originalImageUrl: true,
    },
  });
  return video?.originalImageUrl;
}
