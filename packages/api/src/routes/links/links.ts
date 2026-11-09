import { getLinkMetadata } from "@/utils/linkMetadata";
import { fetchImage } from "@/utils/fetchImage";
import { resolveVideoMetadata, type VideoMetadataResult } from "@/routes/videos/videos";
import type { GetLinkMetadataSchema } from "./schema";
import type { AuthenticatedPageProcedureContext } from "@/utils/middleware";

export type LinkPreview = {
  title: string | null;
  description: string | null;
  siteName: string | null;
  imageId: string | null;
};

export type LinkMetadataResult =
  | VideoMetadataResult
  | {
      type: "LINK";
      url: string;
      /** The page's preview, or `null` when the page could not be fetched. */
      preview: LinkPreview | null;
    };

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
  if (!linkMetadata) {
    return { type: "LINK", url, preview: null };
  }

  const { title, description, siteName, imageUrl } = linkMetadata;
  const imageId = imageUrl ? await fetchImage(imageUrl, ctx.workspaceId, ctx.userId) : null;

  return {
    type: "LINK",
    url,
    preview: { title, description, siteName, imageId },
  };
}
