import { z } from "zod";
import { createSection } from "@/routes/sections/sections.ts";
import { ColorSchema } from "@/schema/Color.ts";
import { SizeSchema, getDimensions } from "./schema.ts";
import type { FunctionToolOptions, ToolContext } from "./types.ts";

const CreateSectionSchema = z.strictObject({
  size: SizeSchema,
  layout: z
    .enum(["grid", "horizontal", "vertical", "freeform"])
    .nullable()
    .meta({
      description:
        "Layout type: grid (default), horizontal (side-by-side scrollable), vertical (stacked), or freeform (free positioning)",
    }),
  backgroundColor: ColorSchema.nullable().meta({
    description: "Background color for the section, or null for no background",
  }),
});

async function createSectionArtifact(
  args: z.infer<typeof CreateSectionSchema>,
  { pageId }: ToolContext,
) {
  const layout = (args.layout?.toUpperCase() ?? undefined) as
    | "GRID"
    | "HORIZONTAL"
    | "VERTICAL"
    | "FREEFORM"
    | undefined;

  const background = args.backgroundColor
    ? { type: "color" as const, color: args.backgroundColor }
    : undefined;

  const artifact = await createSection({
    pageId,
    layout,
    background,
    ...getDimensions(args.size),
  });

  return { artifact };
}

export const CREATE_SECTION_TOOL: FunctionToolOptions<
  typeof CreateSectionSchema
> = {
  name: "create_section",
  description:
    "Creates a section container for grouping related content. After creating a section, use its ID as the sectionId parameter in other tools to add content inside it.",
  schema: CreateSectionSchema,
  function: createSectionArtifact,
};
