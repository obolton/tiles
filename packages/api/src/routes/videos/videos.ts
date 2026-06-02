import prisma from "@/database/prisma";
import { getLinkMetadata } from "@/utils/linkMetadata";
import { getVideoInfo } from "@/utils/videos";
import type { CreateVideoSchema } from "./schema";
import { createTile } from "../tiles/tiles";
import { VIDEO_FIELDS } from "./fields";

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

  return { ...tile, ...video! };
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
