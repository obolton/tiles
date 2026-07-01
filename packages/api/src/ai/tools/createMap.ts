import { z } from "zod";
import { MapStyle } from "doc/types/tiles/section";
import { buildSectionMap } from "doc/tiles/section";
import { SizeSchema, getDimensions } from "./schema.ts";
import type { FunctionToolOptions, TileResult, ToolContext } from "./types.ts";

const CreateMapSchema = z.strictObject({
  size: SizeSchema,
  mapStyle: z
    .enum(MapStyle)
    .meta({
      description: "Map style: DEFAULT (street map), SATELLITE, WATERCOLOR, or MONOCHROME",
    })
    .default("DEFAULT"),
});

async function createMapTile(
  args: z.infer<typeof CreateMapSchema>,
  { session }: ToolContext,
): Promise<TileResult> {
  const { size, mapStyle } = args;
  const map = buildSectionMap({
    layout: "MAP",
    mapStyle,
    ...getDimensions(size),
  });
  const tileId = session.createTile(map);
  return { tileId, type: "SECTION" };
}

export const CREATE_MAP_TOOL: FunctionToolOptions<typeof CreateMapSchema> = {
  name: "create_map",
  description:
    "Creates an interactive map. After creating a map, use its ID as the sectionId parameter in other tools and provide coordinates (lat/long) to place content as pins on the map.",
  schema: CreateMapSchema,
  function: createMapTile,
};
