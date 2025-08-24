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

const CreateMapSchema = z.object({
  places: z
    .array(
      z.object({
        name: z
          .string()
          .meta({ description: "The place name, e.g. The Statue of Liberty" }),
        latitude: z.number().min(MIN_LATITUDE).max(MAX_LATITUDE).meta({
          description: "The latitude of the place in degrees, e.g. 40.6947195",
        }),
        longitude: z.number().min(MIN_LONGITUDE).max(MAX_LONGITUDE).meta({
          description:
            "The longitude of the place in degrees, e.g. -74.0376457",
        }),
      }),
    )
    .min(1),
});

export const CREATE_MAP_TOOL = {
  type: "function",
  name: "create_map",
  description: "Creates a new map.",
  parameters: z.toJSONSchema(CreateMapSchema),
  strict: true,
} satisfies FunctionTool;

async function createMapTool(
  args: z.infer<typeof CreateMapSchema>,
  { pageId, sectionId, model }: ToolContext,
) {
  const {
    places: [place],
  } = args;
  if (!place) {
    throw new Error("No place was returned");
  }
  const { name, latitude, longitude } = place;
  return createMap({
    pageId,
    sectionId,
    width: 10,
    height: 10,
    place: {
      name,
      lat: latitude,
      long: longitude,
      boundingBox: null,
      address: null,
      providerId: model,
    },
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
