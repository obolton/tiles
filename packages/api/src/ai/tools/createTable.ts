import { z } from "zod";
import { createTableWithData } from "@/routes/tables/tables.ts";
import type { FunctionToolOptions, ToolContext } from "./types.ts";

const CreateTableSchema = z.strictObject({
  sectionId: z.string().nullable().meta({
    description: "Section ID to place this content inside a section, or null",
  }),
  columns: z
    .array(
      z.strictObject({
        title: z.string().max(50).meta({ description: "Column header text" }),
      }),
    )
    .min(2)
    .max(8)
    .meta({ description: "Column definitions with titles" }),
  rows: z
    .array(z.array(z.string().max(500)))
    .min(1)
    .max(15)
    .meta({
      description: "Row data as arrays of cell values, matching column order",
    }),
});

async function createTableArtifact(
  args: z.infer<typeof CreateTableSchema>,
  { pageId, sectionId, resolveArtifactId }: ToolContext,
) {
  const resolvedSectionId = args.sectionId
    ? resolveArtifactId(args.sectionId)
    : sectionId;
  const artifact = await createTableWithData({
    pageId,
    sectionId: resolvedSectionId,
    columns: args.columns,
    rows: args.rows,
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
