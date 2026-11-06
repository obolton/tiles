import { getLinkMetadata } from "@/utils/linkMetadata";
import { fetchImage } from "@/utils/fetchImage";
import { getVideoInfo } from "@/utils/videos";
import type { GetLinkMetadataSchema } from "./schema";
import type { AuthenticatedPageProcedureContext } from "@/utils/middleware";
import type { VideoType } from "doc/types/enums";

export type VideoMetadataResult = {
  type: "VIDEO";
  videoType: VideoType;
  videoId: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
};

export type LinkMetadataResult =
  | VideoMetadataResult
  | {
      type: "LINK";
      url: string;
      title: string | null;
      description: string | null;
      siteName: string | null;
      imageId: string | null;
    };

/** Resolves a URL to its video details, or `null` when it is not a supported video. */
export async function resolveVideoMetadata({
  url,
}: GetLinkMetadataSchema): Promise<VideoMetadataResult | null> {
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

export async function resolveLinkMetadata(
  input: GetLinkMetadataSchema,
  ctx: AuthenticatedPageProcedureContext,
): Promise<LinkMetadataResult> {
  const video = await resolveVideoMetadata(input);
  if (video) {
    return video;
  }

  const { url } = input;
  const linkMetadata = await getLinkMetadata(url);
  const { title = null, description = null, siteName = null, imageUrl = null } = linkMetadata ?? {};
  const imageId = imageUrl ? await fetchImage(imageUrl, ctx.workspaceId, ctx.userId) : null;

  return {
    type: "LINK",
    url,
    title,
    description,
    siteName,
    imageId,
  };
}
