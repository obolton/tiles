import { z } from "zod";
import { resolveLinkMetadata } from "@/routes/links/links.ts";
import { buildLinkMap } from "doc/tiles/link";
import { buildVideoMap } from "doc/tiles/video";
import { SizeSchema, getDimensions, CoordinatesSchema } from "./schema.ts";
import type { FunctionToolOptions, ToolContext } from "./types.ts";

const CreateLinkSchema = z.strictObject({
  sectionId: z.number().int().nullable().meta({
    description: "Section ID to place this content inside a section, or null",
  }),
  url: z.string().meta({
    description: "A URL to create a link to",
  }),
  size: SizeSchema,
  coordinates: CoordinatesSchema,
});

async function createLinkTile(
  args: z.infer<typeof CreateLinkSchema>,
  context: ToolContext,
) {
  const { url, size, coordinates } = args;
  const { pageId, sectionId, resolveArtifactId, session } = context;
  const parentId =
    args.sectionId !== null ? resolveArtifactId(args.sectionId) : sectionId;

  // Unfurl the URL: video links (e.g. YouTube) become video tiles, everything
  // else becomes a link card.
  const metadata = await resolveLinkMetadata({ pageId, url }, context);
  const dimensions = getDimensions(size);

  const map =
    metadata.type === "VIDEO"
      ? buildVideoMap({
          videoType: metadata.videoType,
          videoId: metadata.videoId,
          title: metadata.title,
          description: metadata.description,
          imageUrl: metadata.imageUrl,
          ...dimensions,
          coordinates,
        })
      : buildLinkMap({
          url: metadata.url,
          title: metadata.title,
          description: metadata.description,
          siteName: metadata.siteName,
          imageId: metadata.imageId,
          ...dimensions,
          coordinates,
        });

  const tileId = session.createTile(map, { parentId });
  return { tileId };
}

export const CREATE_LINK_TOOL: FunctionToolOptions<typeof CreateLinkSchema> = {
  name: "create_link",
  description: "Creates a link card for a URL.",
  schema: CreateLinkSchema,
  function: createLinkTile,
};
