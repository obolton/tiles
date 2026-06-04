import { z } from "zod";
import { createTable } from "@/routes/tables/tables";
import {
  SizeSchema,
  getDimensions,
  AIColumnDefinitionSchema,
  CoordinatesSchema,
  resolveParentId,
} from "./schema";
import type { FunctionToolOptions, ToolContext } from "./types";

const CreateTableSchema = z.strictObject({
  parentId: z.number().int().nullable().meta({
    description:
      "ID of a section or map to place this content inside (from a create_section or create_map result), or null",
  }),
  size: SizeSchema,
  columns: z.array(AIColumnDefinitionSchema).min(2).max(8).meta({
    description: "Column definitions with titles and optional styling",
  }),
  rows: z
    .array(z.array(z.string().max(500)))
    .min(1)
    .max(15)
    .meta({
      description: "Row data as arrays of cell values, matching column order",
    }),
  coordinates: CoordinatesSchema,
});

async function createTableArtifact(
  args: z.infer<typeof CreateTableSchema>,
  context: ToolContext,
) {
  const { pageId } = context;
  const { size, columns, rows, coordinates } = args;
  const parentId = resolveParentId(args.parentId, context);
  const artifact = await createTable({
    pageId,
    sectionId: parentId,
    columns: columns.map((col) => ({
      title: col.title ?? undefined,
      background: col.background,
    })),
    rows,
    ...getDimensions(size),
    lat: coordinates?.lat,
    long: coordinates?.long,
  });
  return { artifact };
}

export const CREATE_TABLE_TOOL: FunctionToolOptions<typeof CreateTableSchema> =
  {
    name: "create_table",
    description:
      "Creates a table with columns and data. Use for comparisons, specifications, schedules, pricing, feature lists, or any structured information that benefits from a tabular format.",
    schema: CreateTableSchema,
    function: createTableArtifact,
  };
