import { z } from "zod";
import { CommonTileSchema, CoordinatesSchema } from "./schema.ts";
import type { FunctionToolOptions, ToolContext } from "./types.ts";

const EditStyleSchema = z.strictObject({
  id: z.number().int().meta({
    description: "The ID of the tile to style",
  }),
  ...CommonTileSchema,
  coordinates: CoordinatesSchema,
});

async function editStyle(
  args: z.infer<typeof EditStyleSchema>,
  { session, resolveArtifactId }: ToolContext,
) {
  const { id, ...fields } = args;
  const changes: Record<string, unknown> = Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== null),
  );

  session.setProperties(resolveArtifactId(id), changes);
}

export const EDIT_STYLE_TOOL: FunctionToolOptions<typeof EditStyleSchema> = {
  name: "edit_style",
  description:
    "Update the visual styling of a tile (background, colors, animation, frame). Does not change content.",
  schema: EditStyleSchema,
  function: editStyle,
};
