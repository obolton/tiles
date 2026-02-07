import { z } from "zod";
import { CommonTileSchema } from "./schema.ts";
import type { ActionResult, FunctionToolOptions, ToolContext } from "./types.ts";

const EditStyleSchema = z.strictObject({
  id: z.string().meta({
    description: "The ID of the tile to style (e.g., text-0, table-1)",
  }),
  ...CommonTileSchema,
});

async function editStyle(
  args: z.infer<typeof EditStyleSchema>,
  context: ToolContext,
): Promise<ActionResult> {
  const tileId = context.resolveArtifactId(args.id);
  const { id: _, position, hide, ...changes } = args;

  return {
    actions: [
      {
        type: "tile.setProperties",
        data: {
          tileId,
          changes: {
            ...changes,
            hide: hide ?? undefined,
            ...(position ? { x: position.x, y: position.y } : {}),
          },
        },
      },
    ],
  };
}

export const EDIT_STYLE_TOOL: FunctionToolOptions<typeof EditStyleSchema> = {
  name: "edit_style",
  description:
    "Update the visual styling of a tile (background, colors, animation, frame). Does not change content.",
  schema: EditStyleSchema,
  function: editStyle,
};
