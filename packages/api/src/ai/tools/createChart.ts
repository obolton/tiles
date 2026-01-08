import { z } from "zod";
import { createChart, getTableColumns } from "@/routes/charts/charts.ts";
import { SizeSchema, getDimensions } from "./schema.ts";
import type { FunctionToolOptions, ToolContext } from "./types.ts";

const CreateChartSchema = z.strictObject({
  sectionId: z.string().nullable().meta({
    description: "Section ID to place this content inside a section, or null",
  }),
  size: SizeSchema,
  tableId: z.string().meta({
    description: "The ID of the table to visualize (from create_table result)",
  }),
  labelColumnIndex: z.number().int().min(0).nullable().meta({
    description:
      "Column index (0-based) for x-axis labels, or null for no labels",
  }),
  series: z
    .array(
      z.strictObject({
        columnIndex: z.number().int().min(0).meta({
          description: "Column index (0-based) containing numeric data",
        }),
        type: z.enum(["bar", "line", "area"]).default("bar").meta({
          description: "Chart type for this series",
        }),
      }),
    )
    .min(1)
    .max(10)
    .meta({ description: "Data series to display in the chart" }),
});

async function createChartArtifact(
  args: z.infer<typeof CreateChartSchema>,
  { pageId, sectionId, resolveArtifactId }: ToolContext,
) {
  const resolvedSectionId = args.sectionId
    ? resolveArtifactId(args.sectionId)
    : sectionId;
  const tableId = resolveArtifactId(args.tableId);
  const columns = await getTableColumns(pageId, tableId);

  const labelColumnId =
    args.labelColumnIndex !== null
      ? columns[args.labelColumnIndex]?.id
      : undefined;

  const series = args.series.map((s) => {
    const column = columns[s.columnIndex];
    if (!column) {
      throw new Error(`Column index ${s.columnIndex} out of bounds`);
    }
    return {
      columnId: column.id,
      type: s.type.toUpperCase() as "BAR" | "LINE" | "AREA",
    };
  });

  const artifact = await createChart({
    pageId,
    sectionId: resolvedSectionId,
    tableId,
    labelColumnId,
    series,
    ...getDimensions(args.size),
  });

  return { artifact };
}

export const CREATE_CHART_TOOL: FunctionToolOptions<typeof CreateChartSchema> =
  {
    name: "create_chart",
    description:
      "Creates a chart to visualize data from a table. First create a table with create_table, then use this tool with the table ID. Supports bar, line, and area charts.",
    schema: CreateChartSchema,
    function: createChartArtifact,
  };
