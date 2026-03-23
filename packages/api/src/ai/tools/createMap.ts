import { z } from "zod";
import { MapStyle } from "@/generated/prisma/enums";
import { createSection } from "@/routes/sections/sections.ts";
import { SizeSchema, getDimensions } from "./schema.ts";
import type { FunctionToolOptions, ToolContext } from "./types.ts";

const CreateMapSchema = z.strictObject({
  size: SizeSchema,
  mapStyle: z
    .enum(MapStyle)
    .meta({
      description:
        "Map style: DEFAULT (street map), SATELLITE, WATERCOLOR, or MONOCHROME",
    })
    .default("DEFAULT"),
});

async function createMapArtifact(
  args: z.infer<typeof CreateMapSchema>,
  { pageId }: ToolContext,
) {
  const { size, mapStyle } = args;

  const artifact = await createSection({
    pageId,
    layout: "MAP",
    mapStyle,
    ...getDimensions(size),
  });

  return { artifact };
}

export const CREATE_MAP_TOOL: FunctionToolOptions<typeof CreateMapSchema> = {
  name: "create_map",
  description:
    "Creates an interactive map. After creating a map, use its ID as the sectionId parameter in other tools and provide coordinates (lat/long) to place content as pins on the map.",
  schema: CreateMapSchema,
  function: createMapArtifact,
};
