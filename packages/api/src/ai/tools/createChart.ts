import { z } from "zod";
import { createChart, getTableColumns } from "@/routes/charts/charts";
import { ColorSchema } from "@/schema/Color";
import {
  SizeSchema,
  getDimensions,
  CoordinatesSchema,
  resolveParentId,
} from "./schema";
import type { FunctionToolOptions, ToolContext } from "./types";

const CreateChartSchema = z.strictObject({
  parentId: z.number().int().nullable().meta({
    description:
      "ID of a section or map to place this content inside (from a create_section or create_map result), or null",
  }),
  size: SizeSchema,
  tableId: z.number().int().meta({
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
        type: z.enum(["bar", "line", "area"]).meta({
          description: "Chart type for this series",
        }),
        color: ColorSchema.nullable().meta({
          description: "Fill color for this series, or null for default",
        }),
      }),
    )
    .min(1)
    .max(10)
    .meta({ description: "Data series to display in the chart" }),
  coordinates: CoordinatesSchema,
});

async function createChartArtifact(
  args: z.infer<typeof CreateChartSchema>,
  context: ToolContext,
) {
  const { pageId, resolveArtifactId } = context;
  const { size } = args;
  const parentId = resolveParentId(args.parentId, context);
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
      fill: s.color ? { type: "color" as const, color: s.color } : undefined,
    };
  });

  const artifact = await createChart({
    pageId,
    sectionId: parentId,
    tableId,
    labelColumnId,
    series,
    ...getDimensions(size),
    lat: args.coordinates?.lat,
    long: args.coordinates?.long,
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
