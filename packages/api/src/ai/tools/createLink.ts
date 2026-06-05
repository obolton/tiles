import { z } from "zod";
import { resolveLinkMetadata } from "@/routes/links/links.ts";
import { buildLinkMap } from "doc/tiles/link";
import { buildVideoMap } from "doc/tiles/video";
import {
  SizeSchema,
  getDimensions,
  CoordinatesSchema,
  resolveParentId,
} from "./schema";
import type { FunctionToolOptions, TileResult, ToolContext } from "./types";

const CreateLinkSchema = z.strictObject({
  parentId: z.number().int().nullable().meta({
    description:
      "ID of a section or map to place this content inside (from a create_section or create_map result), or null",
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
): Promise<TileResult> {
  const { url, size, coordinates } = args;
  const { pageId, session } = context;
  const parentId = resolveParentId(args.parentId, context);

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
  return { tileId, type: metadata.type === "VIDEO" ? "VIDEO" : "LINK" };
}

export const CREATE_LINK_TOOL: FunctionToolOptions<typeof CreateLinkSchema> = {
  name: "create_link",
  description: "Creates a link card for a URL.",
  schema: CreateLinkSchema,
  function: createLinkTile,
};
