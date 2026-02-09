import { z } from "zod";
import type {
  ActionResult,
  FunctionToolOptions,
  ToolContext,
} from "./types.ts";

const DeleteTilesSchema = z.strictObject({
  ids: z.array(z.number().int()).min(1).max(20).meta({
    description: "The IDs of the tiles to delete",
  }),
});

async function deleteTiles(
  args: z.infer<typeof DeleteTilesSchema>,
  context: ToolContext,
): Promise<ActionResult> {
  const tileIds = args.ids.map((id) => context.resolveArtifactId(id));

  return {
    actions: [
      {
        type: "tile.delete",
        data: { tileIds },
      },
    ],
  };
}

export const DELETE_TILES_TOOL: FunctionToolOptions<typeof DeleteTilesSchema> =
  {
    name: "delete_tiles",
    description: "Delete one or more tiles from the document.",
    schema: DeleteTilesSchema,
    function: deleteTiles,
  };
