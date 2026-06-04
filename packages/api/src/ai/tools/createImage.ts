import { z } from "zod";
import { buildImageMap } from "doc/tiles/image";
import { IMAGE_GENERATION_DIMENSIONS } from "../constants";
import { generateAndUploadImage } from "./images";
import { CoordinatesSchema, resolveParentId } from "./schema";
import type { FunctionToolOptions, ToolContext } from "./types";

const CreateImageSchema = z.strictObject({
  parentId: z.number().int().nullable().meta({
    description:
      "ID of a section or map to place this content inside (from a create_section or create_map result), or null",
  }),
  prompt: z.string().meta({
    description: "A detailed description of the image to generate",
  }),
  coordinates: CoordinatesSchema,
});

async function createImageTile(
  args: z.infer<typeof CreateImageSchema>,
  context: ToolContext,
) {
  const { prompt, coordinates } = args;
  const parentId = resolveParentId(args.parentId, context);
  const imageId = await generateAndUploadImage(prompt, context);
  // Generated images are square (1024×1024), so use a fixed square footprint.
  const map = buildImageMap({
    imageId,
    size: IMAGE_GENERATION_DIMENSIONS,
    width: 12,
    height: 12,
    coordinates,
  });
  const tileId = context.session.createTile(map, { parentId });
  return { tileId };
}

export const CREATE_IMAGE_TOOL: FunctionToolOptions<typeof CreateImageSchema> =
  {
    name: "create_image",
    description:
      "Generates an image from a text prompt and places it as an image block. Pass a parentId and/or coordinates to place it inside a section or on a map.",
    schema: CreateImageSchema,
    function: createImageTile,
  };
