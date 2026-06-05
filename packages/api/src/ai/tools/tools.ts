import { z } from "zod";
import type {
  FunctionTool,
  Tool,
  ResponseFunctionToolCall,
} from "openai/resources/responses/responses";
import { CREATE_IMAGE_TOOL } from "./createImage";
import { CREATE_LINK_TOOL } from "./createLink";
import { CREATE_MAP_TOOL } from "./createMap";
import { CREATE_SECTION_TOOL } from "./createSection";
import { CREATE_TEXT_TOOL } from "./createText";
import { DELETE_TILES_TOOL } from "./deleteTile";
import { EDIT_STYLE_TOOL } from "./editStyle";
import type { FunctionToolOptions, ToolContext } from "./types";

export const FUNCTION_TOOLS: FunctionToolOptions[] = [
  CREATE_TEXT_TOOL,
  CREATE_IMAGE_TOOL,
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

export const TOOLS: Tool[] = FUNCTION_TOOLS.map(functionTool);

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
