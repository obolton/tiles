import { z } from "zod";
import { buildTextMap } from "doc/tiles/text";
import {
  SizeSchema,
  getDimensions,
  CoordinatesSchema,
  resolveParentId,
} from "./schema";
import type { FunctionToolOptions, ToolContext } from "./types";

const CreateTextSchema = z.strictObject({
  parentId: z.number().int().nullable().meta({
    description:
      "ID of a section or map to place this content inside (from a create_section or create_map result), or null",
  }),
  align: z
    .enum(["left", "center", "right", "justify"])
    .nullable()
    .meta({ description: "The horizontal alignment of the text." }),
  size: SizeSchema,
  coordinates: CoordinatesSchema,
});

async function createTextTile(
  args: z.infer<typeof CreateTextSchema>,
  context: ToolContext,
) {
  const { size, coordinates } = args;
  const parentId = resolveParentId(args.parentId, context);
  const map = buildTextMap({ ...getDimensions(size), coordinates });
  const tileId = context.session.createTile(map, { parentId });
  return { tileId };
}

export const CREATE_TEXT_TOOL: FunctionToolOptions<typeof CreateTextSchema> = {
  name: "create_text",
  description: "Creates a text block to contain a section of text.",
  schema: CreateTextSchema,
  function: createTextTile,
};
