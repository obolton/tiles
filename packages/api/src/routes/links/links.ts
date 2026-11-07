import { getLinkMetadata } from "@/utils/linkMetadata";
import { fetchImage } from "@/utils/fetchImage";
import { resolveVideoMetadata, type VideoMetadataResult } from "@/routes/videos/videos";
import type { GetLinkMetadataSchema } from "./schema";
import type { AuthenticatedPageProcedureContext } from "@/utils/middleware";

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
