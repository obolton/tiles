import { z } from "zod";
import type { FunctionToolOptions, ToolContext } from "./types.ts";

const DeleteTilesSchema = z.strictObject({
  ids: z.array(z.number().int()).min(1).max(20).meta({
    description: "The IDs of the tiles to delete",
  }),
});

async function deleteTiles(
  args: z.infer<typeof DeleteTilesSchema>,
  { session, resolveArtifactId }: ToolContext,
) {
  const tileIds = args.ids.map((id) => resolveArtifactId(id));
  session.deleteTiles(tileIds);
}

export const DELETE_TILES_TOOL: FunctionToolOptions<typeof DeleteTilesSchema> =
  {
    name: "delete_tiles",
    description: "Delete one or more tiles from the document.",
    schema: DeleteTilesSchema,
    function: deleteTiles,
  };
