import { z } from "zod";
import { Layout } from "@/generated/prisma/enums";
import { buildSectionMap } from "doc/tiles/section";
import { SizeSchema, getDimensions } from "./schema.ts";
import type { FunctionToolOptions, ToolContext } from "./types.ts";

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
) {
  const { size, layout } = args;
  const map = buildSectionMap({ layout, ...getDimensions(size) });
  const tileId = session.createTile(map);
  return { tileId };
}

export const CREATE_SECTION_TOOL: FunctionToolOptions<
  typeof CreateSectionSchema
> = {
  name: "create_section",
  description:
    "Creates a section container for grouping related content. After creating a section, use its ID as the sectionId parameter in other tools to add content inside it.",
  schema: CreateSectionSchema,
  function: createSectionTile,
};
