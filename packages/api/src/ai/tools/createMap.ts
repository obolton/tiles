import { z } from "zod";
import { MapStyle } from "doc/types/enums";
import { buildSectionMap } from "doc/tiles/section";
import { SizeSchema, getDimensions } from "./schema";
import type { FunctionToolOptions, TileResult, ToolContext } from "./types";

const CreateMapSchema = z.strictObject({
  size: SizeSchema,
  mapStyle: z.enum(MapStyle).nullable().meta({
    description:
      "Map style: DEFAULT (street map), SATELLITE, WATERCOLOR, or MONOCHROME. Use null for the default style.",
  }),
});

async function createMapTile(
  args: z.infer<typeof CreateMapSchema>,
  { session }: ToolContext,
): Promise<TileResult> {
  const { size, mapStyle } = args;
  const map = buildSectionMap({
    layout: "MAP",
    mapStyle: mapStyle ?? "DEFAULT",
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
