import { z } from "zod";
import { IdSchema } from "./schema";
import type { FunctionToolOptions, ToolContext } from "./types";

const DeleteTilesSchema = z.strictObject({
  ids: z.array(IdSchema).min(1).meta({
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

export const DELETE_TILES_TOOL: FunctionToolOptions<typeof DeleteTilesSchema> = {
  name: "delete_tiles",
  description: "Delete one or more tiles from the document.",
  schema: DeleteTilesSchema,
  function: deleteTiles,
};
