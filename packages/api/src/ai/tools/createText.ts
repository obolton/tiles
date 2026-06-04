import { z } from "zod";
import { buildTextMap } from "doc/tiles/text";
import { SizeSchema, getDimensions, CoordinatesSchema } from "./schema.ts";
import type { FunctionToolOptions, ToolContext } from "./types.ts";

const CreateTextSchema = z.strictObject({
  sectionId: z.number().int().nullable().meta({
    description: "Section ID to place this content inside a section, or null",
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
  { sectionId, resolveArtifactId, session }: ToolContext,
) {
  const { size, coordinates } = args;
  const parentId =
    args.sectionId !== null ? resolveArtifactId(args.sectionId) : sectionId;
  const map = buildTextMap({ ...getDimensions(size), coordinates });
  const tileId = session.createTile(map, { parentId });
  return { tileId };
}

export const CREATE_TEXT_TOOL: FunctionToolOptions<typeof CreateTextSchema> = {
  name: "create_text",
  description: "Creates a text block to contain a section of text.",
  schema: CreateTextSchema,
  function: createTextTile,
};
