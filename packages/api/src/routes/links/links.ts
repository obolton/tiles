import { getLinkMetadata } from "@/utils/linkMetadata";
import { fetchImage } from "@/utils/fetchImage";
import { getVideoInfo } from "@/utils/videos";
import type { GetLinkMetadataSchema } from "./schema";
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
