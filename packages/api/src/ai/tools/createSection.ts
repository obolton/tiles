import { z } from "zod";
import { Layout } from "doc/types/tiles/section";
import { buildSectionMap } from "doc/tiles/section";
import { SizeSchema, getDimensions } from "./schema.ts";
import type { FunctionToolOptions, TileResult, ToolContext } from "./types.ts";

const CreateSectionSchema = z.strictObject({
  size: SizeSchema,
  layout: z.enum(Layout).meta({
    description:
      "Layout type: GRID (default), HORIZONTAL (side-by-side scrollable), VERTICAL (stacked), or FREEFORM (free positioning)",
  }),
});

async function createSectionTile(
  args: z.infer<typeof CreateSectionSchema>,
  { session }: ToolContext,
): Promise<TileResult> {
  const { size, layout } = args;
  const map = buildSectionMap({ layout, ...getDimensions(size) });
  const tileId = session.createTile(map);
  return { tileId, type: "SECTION" };
}

export const CREATE_SECTION_TOOL: FunctionToolOptions<typeof CreateSectionSchema> = {
  name: "create_section",
  description:
    "Creates a section container for grouping related content. After creating a section, use its ID as the sectionId parameter in other tools to add content inside it.",
  schema: CreateSectionSchema,
  function: createSectionTile,
};
