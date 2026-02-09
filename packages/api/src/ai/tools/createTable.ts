import { z } from "zod";
import { createTable } from "@/routes/tables/tables.ts";
import {
  SizeSchema,
  getDimensions,
  AIColumnDefinitionSchema,
} from "./schema.ts";
import type { FunctionToolOptions, ToolContext } from "./types.ts";

const CreateTableSchema = z.strictObject({
  sectionId: z.number().int().nullable().meta({
    description: "Section ID to place this content inside a section, or null",
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
});

async function createTableArtifact(
  args: z.infer<typeof CreateTableSchema>,
  { pageId, sectionId, resolveArtifactId }: ToolContext,
) {
  const { size, columns, rows } = args;
  const resolvedSectionId =
    args.sectionId !== null ? resolveArtifactId(args.sectionId) : sectionId;
  const artifact = await createTable({
    pageId,
    sectionId: resolvedSectionId,
    columns: columns.map((col) => ({
      title: col.title ?? undefined,
      background: col.background,
    })),
    rows,
    ...getDimensions(size),
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
