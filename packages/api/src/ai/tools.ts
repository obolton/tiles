import { z } from "zod";
import {
  MIN_LATITUDE,
  MAX_LATITUDE,
  MIN_LONGITUDE,
  MAX_LONGITUDE,
} from "@/constants/geo.ts";
import type {
  FunctionTool,
  Tool,
  ResponseFunctionToolCall,
} from "openai/resources/responses/responses";
import { createMap } from "@/routes/maps/maps.ts";

const CreateMapSchema = z.strictObject({
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
});

export const CREATE_MAP_TOOL = {
  type: "function",
  name: "create_map",
  description: "Creates a map showing one or more locations.",
  parameters: z.toJSONSchema(CreateMapSchema),
  strict: true,
} satisfies FunctionTool;

async function createMapTool(
  args: z.infer<typeof CreateMapSchema>,
  { pageId, sectionId, model }: ToolContext,
) {
  const { places } = args;
  return createMap({
    pageId,
    sectionId,
    width: 10,
    height: 10,
    places: places.map(({ name, lat, long, address }) => ({
      name,
      lat,
      long,
      boundingBox: null,
      address,
      providerId: model,
    })),
  });
}

export const TOOLS: Tool[] = [CREATE_MAP_TOOL];

export interface ToolContext {
  pageId: string;
  sectionId: string;
  model: string;
}

export async function callFunction(
  call: ResponseFunctionToolCall,
  context: ToolContext,
) {
  const args = JSON.parse(call.arguments) as unknown;
  switch (call.name) {
    case "create_map": {
      const parsedArgs = CreateMapSchema.parse(args);
      const artifact = await createMapTool(parsedArgs, context);
      return { artifact };
    }
    default:
      throw new Error(`Unknown function name: ${call.name}`);
  }
}

export type FunctionCallResult = Awaited<ReturnType<typeof callFunction>>;
