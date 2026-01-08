import { z } from "zod";
import {
  MIN_LATITUDE,
  MAX_LATITUDE,
  MIN_LONGITUDE,
  MAX_LONGITUDE,
} from "@/constants/geo.ts";
import { MapStyle } from "@/generated/prisma/client";
import { createMap } from "@/routes/maps/maps.ts";
import { SizeSchema, getDimensions } from "./schema.ts";
import type { FunctionToolOptions, ToolContext } from "./types.ts";

const CreateMapSchema = z.strictObject({
  sectionId: z.string().nullable().meta({
    description: "Section ID to place this content inside a section, or null",
  }),
  size: SizeSchema,
  places: z
    .array(
      z.strictObject({
        name: z.string().meta({
          description: "The name of the place, e.g. The Statue of Liberty",
        }),
        lat: z.number().min(MIN_LATITUDE).max(MAX_LATITUDE).meta({
          description: "The latitude of the place in degrees, e.g. 40.6947195",
        }),
        long: z.number().min(MIN_LONGITUDE).max(MAX_LONGITUDE).meta({
          description:
            "The longitude of the place in degrees, e.g. -74.0376457",
        }),
        address: z.string().nullable().meta({
          description: "The street address of the place, if available.",
        }),
      }),
    )
    .min(1)
    .max(20)
    .meta({ description: "A list of places to show on the map." }),
  style: z
    .enum(["default", "satellite", "watercolor", "monochrome"])
    .nullable()
    .meta({
      description:
        "The visual style of the map: default, satellite, watercolor, or monochrome.",
    }),
});

async function createMapArtifact(
  args: z.infer<typeof CreateMapSchema>,
  { pageId, sectionId, model, resolveArtifactId }: ToolContext,
) {
  const { places, size, style } = args;
  const resolvedSectionId = args.sectionId
    ? resolveArtifactId(args.sectionId)
    : sectionId;
  const artifact = await createMap({
    pageId,
    sectionId: resolvedSectionId,
    ...getDimensions(size),
    style: style ? (style.toUpperCase() as MapStyle) : undefined,
    places: places.map(({ name, lat, long, address }) => ({
      name,
      lat,
      long,
      boundingBox: null,
      address,
      providerId: model,
    })),
  });
  return { artifact };
}

export const CREATE_MAP_TOOL: FunctionToolOptions<typeof CreateMapSchema> = {
  name: "create_map",
  description: "Creates a map showing one or more locations.",
  schema: CreateMapSchema,
  function: createMapArtifact,
};
