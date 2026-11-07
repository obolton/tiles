import { getLinkMetadata } from "@/utils/linkMetadata";
import { getVideoInfo } from "@/utils/videos";
import type { GetVideoMetadataSchema } from "./schema";
import type { VideoType } from "doc/types/enums";

export type VideoMetadataResult = {
  type: "VIDEO";
  videoType: VideoType;
  videoId: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
};

/** Resolves a URL to its video details, or `null` when it is not a supported video. */
export async function resolveVideoMetadata({
  url,
}: GetVideoMetadataSchema): Promise<VideoMetadataResult | null> {
  const videoInfo = getVideoInfo(url);
  if (!videoInfo) {
    return null;
  }

  const linkMetadata = await getLinkMetadata(url);

  return {
    type: "VIDEO",
    videoType: videoInfo.videoType,
    videoId: videoInfo.videoId,
    title: linkMetadata?.title ?? "",
    description: linkMetadata?.description ?? null,
    imageUrl: linkMetadata?.imageUrl ?? null,
  };
}
