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
import type { Prisma } from "@prisma/client";

export const CHART_SERIES_FIELDS = {
  id: true,
  title: true,
  column: {
    select: {
      id: true,
      tableId: true,
    },
  },
} as const satisfies Prisma.ChartSeriesSelect<ExtensionArgs>;

export const CHART_FIELDS = {
  id: true,
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
      series.map(({ tableId, columnId }) =>
        transaction.tableColumn.findUniqueOrThrow({
          where: { id: columnId, table: { id: tableId, pageId } },
          select: { id: true },
        }),
      ),
    );

    const chart = await transaction.chart.create({
      data: {
        pageId,
        chartType,
        ...getBackgroundProperties(background),
        series: {
          createMany: {
            data: series.map(({ columnId, title }) => ({
              columnId,
              title,
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
  tableId,
  columnId,
  title,
}: AddSeriesSchema) {
  return prisma.$transaction(async (transaction) => {
    // Verify access to the chart, table and column
    await Promise.all([
      transaction.chart.findUniqueOrThrow({
        where: { id: chartId, pageId },
        select: { id: true },
      }),
      transaction.tableColumn.findUniqueOrThrow({
        where: { id: columnId, table: { id: tableId, pageId } },
        select: { id: true },
      }),
    ]);

    return transaction.chartSeries.create({
      data: {
        chartId,
        columnId,
        title,
      },
      select: CHART_SERIES_FIELDS,
    });
  });
}

export async function updateSeries({
  pageId,
  chartId,
  seriesId,
  title,
}: UpdateSeriesSchema) {
  return prisma.$transaction(async (transaction) => {
    // Verify access to the chart
    await transaction.chart.findUniqueOrThrow({
      where: { id: chartId, pageId },
      select: { id: true },
    });

    return transaction.chartSeries.update({
      data: {
        title,
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
