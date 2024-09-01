import prisma from "@/database/prisma.ts";
import { TileType, type Prisma } from "@prisma/client";
import { getLinkMetadata } from "@/utils/linkMetadata.ts";
import { getVideoImageUrl } from "@/utils/cdn.ts";
import { getVideoInfo } from "@/utils/videos.ts";
import { cleanUserInput } from "@/utils/text.ts";
import type { CreateVideoTileSchema, UpdateVideoTileSchema } from "./schema.ts";

export async function createVideoTile(
  tx: Prisma.TransactionClient,
  { pageId, video: { url } }: CreateVideoTileSchema,
  position: number,
) {
  const videoInfo = getVideoInfo(url);
  if (!videoInfo) {
    throw new Error("Invalid video URL");
  }
  const { videoType, videoId } = videoInfo;
  const linkMetadata = await getLinkMetadata(url);
  const { title, description, imageUrl } = linkMetadata || {};
  const videoTile = await tx.videoTile.create({
    data: {
      videoType,
      videoId,
      imageUrl,
      title: cleanUserInput(title ?? ""),
      description: description ? cleanUserInput(description) : null,
    },
    select: {
      id: true,
    },
  });
  const tile = await tx.tile.create({
    data: {
      pageId,
      type: TileType.VIDEO,
      position,
      columns: 1,
      rows: 1,
      videoTileId: videoTile.id,
    },
    select: {
      id: true,
      type: true,
      position: true,
      columns: true,
      rows: true,
      video: {
        select: {
          videoType: true,
          videoId: true,
          imageUrl: true,
          title: true,
          description: true,
        },
      },
    },
  });
  return {
    ...tile,
    video: {
      ...tile.video!,
      imageUrl: tile.video!.imageUrl ? getVideoImageUrl(tile.id) : null,
    },
  };
}

export async function updateVideoTile(
  tx: Prisma.TransactionClient,
  { id, video: { url } }: UpdateVideoTileSchema,
) {
  const videoInfo = getVideoInfo(url);
  if (!videoInfo) {
    throw new Error("Invalid video URL");
  }
  const { videoType, videoId } = videoInfo;
  const linkMetadata = await getLinkMetadata(url);
  const { title, description, imageUrl } = linkMetadata || {};
  const tile = await tx.tile.update({
    where: {
      id,
    },
    data: {
      video: {
        update: {
          videoType,
          videoId,
          imageUrl,
          title: cleanUserInput(title ?? ""),
          description: description ? cleanUserInput(description) : null,
        },
      },
    },
    select: {
      id: true,
      pageId: true,
      type: true,
      position: true,
      columns: true,
      rows: true,
      video: {
        select: {
          videoType: true,
          videoId: true,
          imageUrl: true,
          title: true,
          description: true,
        },
      },
    },
  });
  return {
    ...tile,
    video: {
      ...tile.video!,
      imageUrl: tile.video!.imageUrl ? getVideoImageUrl(tile.id) : null,
    },
  };
}

export async function getVideoTileImageUrl(id: string) {
  const tile = await prisma.tile.findUnique({
    where: {
      id,
    },
    select: {
      video: {
        select: {
          imageUrl: true,
        },
      },
    },
  });
  return tile?.video?.imageUrl;
}
