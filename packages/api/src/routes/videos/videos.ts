import prisma, { type ExtensionArgs } from "@/database/prisma.ts";
import type { Prisma } from "@prisma/client";
import { getLinkMetadata } from "@/utils/linkMetadata.ts";
import { getVideoInfo } from "@/utils/videos.ts";
import { cleanUserInput } from "@/utils/text.ts";
import type { CreateVideoSchema, UpdateVideoSchema } from "./schema.ts";
import { createTilePlacement } from "../tiles/tiles.ts";

export const VIDEO_FIELDS = {
  id: true,
  videoType: true,
  videoId: true,
  imageUrl: true,
  title: true,
  description: true,
} as const satisfies Prisma.VideoTileSelect<ExtensionArgs>;

export async function createVideo({ pageId, url }: CreateVideoSchema) {
  return prisma.$transaction(async (transaction) => {
    const videoInfo = getVideoInfo(url);
    if (!videoInfo) {
      throw new Error("Invalid video URL");
    }
    const { videoType, videoId } = videoInfo;
    const linkMetadata = await getLinkMetadata(url);
    const { title, description, imageUrl } = linkMetadata || {};
    const video = await transaction.videoTile.create({
      data: {
        videoType,
        videoId,
        originalImageUrl: imageUrl,
        title: cleanUserInput(title ?? ""),
        description: description ? cleanUserInput(description) : null,
      },
      select: VIDEO_FIELDS,
    });
    const placement = await createTilePlacement(
      {
        pageId,
        type: "VIDEO",
        videoTileId: video.id,
      },
      transaction,
    );
    return {
      type: "VIDEO" as const,
      ...video,
      ...placement,
    };
  });
}

export async function updateVideo({ id, title }: UpdateVideoSchema) {
  const video = await prisma.videoTile.update({
    where: {
      id,
    },
    data: {
      title: cleanUserInput(title ?? ""),
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
