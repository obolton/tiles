import { tool, type ToolSet } from "ai";
import { CREATE_IMAGE_TOOL } from "./createImage";
import { CREATE_LINK_TOOL } from "./createLink";
import { CREATE_MAP_TOOL } from "./createMap";
import { CREATE_SECTION_TOOL } from "./createSection";
import { CREATE_TEXT_TOOL } from "./createText";
import { DELETE_TILES_TOOL } from "./deleteTile";
import { EDIT_STYLE_TOOL } from "./editStyle";
import type { FunctionToolOptions, TileResult, ToolContext } from "./types";

export const FUNCTION_TOOLS: FunctionToolOptions[] = [
  CREATE_TEXT_TOOL,
  CREATE_IMAGE_TOOL,
  CREATE_LINK_TOOL,
  CREATE_MAP_TOOL,
  CREATE_SECTION_TOOL,
  DELETE_TILES_TOOL,
  EDIT_STYLE_TOOL,
];

/** Registers a created tile and returns the id the model should use to refer to it. */
export type RegisterTile = (tile: TileResult) => string;

export function createTools(context: ToolContext, registerTile: RegisterTile): ToolSet {
  const tools: ToolSet = {};
  for (const options of FUNCTION_TOOLS) {
    tools[options.name] = tool({
      description: options.description,
      inputSchema: options.schema,
      strict: true,
      execute: async (args) => {
        const result = await options.function(args, context);
        return result ? { id: registerTile(result) } : { status: "ok" };
      },
    });
  }
  return tools;
}
