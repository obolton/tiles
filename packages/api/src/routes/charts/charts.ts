import prisma, { type ExtensionArgs } from "@/database/prisma.ts";
import { createTilePlacement } from "../tiles/tiles.ts";
import { getBackgroundProperties } from "@/utils/backgrounds.ts";
import type {
  CreateChartSchema,
  UpdateChartSchema,
  AddSeriesSchema,
  UpdateSeriesSchema,
  DeleteSeriesSchema,
} from "./schema.ts";
import type { Prisma } from "@/generated/prisma/client";

export const CHART_SERIES_FIELDS = {
  id: true,
  columnId: true,
} as const satisfies Prisma.ChartSeriesSelect<ExtensionArgs>;

export const CHART_FIELDS = {
  id: true,
  tableId: true,
  chartType: true,
  background: true,
  series: {
    select: CHART_SERIES_FIELDS,
  },
} as const satisfies Prisma.ChartSelect<ExtensionArgs>;

export type Chart = Prisma.Result<
  typeof prisma.chart,
  { select: typeof CHART_FIELDS },
  "findUniqueOrThrow"
>;

export async function createChart({
  pageId,
  sectionId,
  tableId,
  width,
  height,
  rowSpan,
  x,
  y,
  block,
  chartType,
  background,
  series = [],
}: CreateChartSchema) {
  return prisma.$transaction(async (transaction) => {
    // Verify access to series data
    await Promise.all(
      series.map((columnId) =>
        transaction.tableColumn.findUniqueOrThrow({
          where: { id: columnId, table: { id: tableId, pageId } },
          select: { id: true },
        }),
      ),
    );

    const chart = await transaction.chart.create({
      data: {
        pageId,
        tableId,
        chartType,
        ...getBackgroundProperties(background),
        series: {
          createMany: {
            data: series.map((columnId) => ({
              columnId,
            })),
          },
        },
      },
      select: CHART_FIELDS,
    });

    const placement = await createTilePlacement(
      {
        type: "CHART",
        pageId,
        sectionId,
        chartId: chart.id,
        width,
        height,
        rowSpan,
        x,
        y,
        block,
      },
      transaction,
    );
    return { type: "CHART" as const, ...chart, ...placement };
  });
}

export async function updateChart({
  pageId,
  id,
  chartType,
  background,
}: UpdateChartSchema) {
  const chart = await prisma.chart.update({
    where: {
      pageId,
      id,
    },
    data: {
      chartType,
      ...getBackgroundProperties(background),
    },
    select: CHART_FIELDS,
  });
  return { type: "CHART" as const, ...chart };
}

export async function addSeries({
  pageId,
  chartId,
  columnId,
}: AddSeriesSchema) {
  return prisma.$transaction(async (transaction) => {
    // Verify access to the chart, table and column
    const { tableId } = await transaction.chart.findUniqueOrThrow({
      where: { id: chartId, pageId },
      select: { id: true, tableId: true },
    });
    await transaction.tableColumn.findUniqueOrThrow({
      where: { id: columnId, table: { id: tableId, pageId } },
      select: { id: true },
    });

    return transaction.chartSeries.create({
      data: {
        chartId,
        columnId,
      },
      select: CHART_SERIES_FIELDS,
    });
  });
}

export async function updateSeries({
  pageId,
  chartId,
  seriesId,
}: UpdateSeriesSchema) {
  return prisma.$transaction(async (transaction) => {
    // Verify access to the chart
    await transaction.chart.findUniqueOrThrow({
      where: { id: chartId, pageId },
      select: { id: true },
    });

    return transaction.chartSeries.update({
      data: {
        // TODO
      },
      where: {
        id: seriesId,
        chartId,
      },
      select: CHART_SERIES_FIELDS,
    });
  });
}

export async function deleteSeries({
  pageId,
  chartId,
  seriesId,
}: DeleteSeriesSchema) {
  return prisma.$transaction(async (transaction) => {
    // Verify access to the chart
    await transaction.chart.findUniqueOrThrow({
      where: { id: chartId, pageId },
      select: { id: true },
    });

    return transaction.chartSeries.delete({
      where: {
        id: seriesId,
        chartId,
      },
      select: { id: true },
    });
  });
}
