import { z } from "zod";
import type {
  FunctionTool,
  Tool,
  ResponseFunctionToolCall,
} from "openai/resources/responses/responses";
import { IMAGE_GENERATION_TOOL } from "./images.ts";
import { CREATE_CHART_TOOL } from "./createChart.ts";
import { CREATE_LINK_TOOL } from "./createLink.ts";
import { CREATE_MAP_TOOL } from "./createMap.ts";
import { CREATE_SECTION_TOOL } from "./createSection.ts";
import { CREATE_TABLE_TOOL } from "./createTable.ts";
import { CREATE_TEXT_TOOL } from "./createText.ts";
import { DELETE_TILES_TOOL } from "./deleteTile.ts";
import { EDIT_STYLE_TOOL } from "./editStyle.ts";
import type { FunctionToolOptions, ToolContext } from "./types.ts";

export const FUNCTION_TOOLS: FunctionToolOptions[] = [
  CREATE_TEXT_TOOL,
  CREATE_TABLE_TOOL,
  CREATE_CHART_TOOL,
  CREATE_LINK_TOOL,
  CREATE_MAP_TOOL,
  CREATE_SECTION_TOOL,
  DELETE_TILES_TOOL,
  EDIT_STYLE_TOOL,
];

function functionTool<T extends z.ZodType>({
  name,
  description,
  schema,
}: FunctionToolOptions<T>): FunctionTool {
  return {
    type: "function",
    name,
    description,
    parameters: z.toJSONSchema(schema),
    strict: true,
  };
}

export const TOOLS: Tool[] = [
  IMAGE_GENERATION_TOOL,
  ...FUNCTION_TOOLS.map(functionTool),
];

export async function useFunctionTool(
  call: ResponseFunctionToolCall,
  context: ToolContext,
) {
  for (const tool of FUNCTION_TOOLS) {
    if (tool.name === call.name) {
      const args = JSON.parse(call.arguments) as unknown;
      const parsedArgs = tool.schema.parse(args);
      const result = await tool.function(parsedArgs, context);
      return result;
    }
  }
  throw new Error(`Unknown tool: ${call.name}`);
}
