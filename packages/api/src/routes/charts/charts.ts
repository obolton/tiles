import prisma, { type ExtensionArgs } from "@/database/prisma";
import { createTile } from "../tiles/tiles";
import { getBackgroundProperties } from "@/utils/backgrounds";
import type {
  CreateChartSchema,
  UpdateChartSchema,
  AddSeriesSchema,
  UpdateSeriesSchema,
  DeleteSeriesSchema,
} from "./schema";
import type { Prisma } from "@/generated/prisma/client";

export const CHART_SERIES_FIELDS = {
  id: true,
  type: true,
  column: {
    select: {
      id: true,
      title: true,
    },
  },
} as const satisfies Prisma.ChartSeriesSelect<ExtensionArgs>;

export type ChartSeries = Prisma.Result<
  typeof prisma.chartSeries,
  { select: typeof CHART_SERIES_FIELDS },
  "findUniqueOrThrow"
>;

export const CHART_FIELDS = {
  id: true,
  tableId: true,
  background: true,
  label: {
    select: {
      id: true,
      title: true,
    },
  },
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
  tableId,
  labelColumnId,
  background,
  series = [],
  ...properties
}: CreateChartSchema) {
  return prisma.$transaction(async (transaction) => {
    // Verify access to data
    if (labelColumnId) {
      await transaction.tableColumn.findUniqueOrThrow({
        where: { id: labelColumnId, table: { id: tableId, pageId } },
        select: { id: true },
      });
    }
    await Promise.all(
      series.map((columnId) =>
        transaction.tableColumn.findUniqueOrThrow({
          where: { id: columnId, table: { id: tableId, pageId } },
          select: { id: true },
        }),
      ),
    );

    const { chart, ...tile } = await createTile(
      {
        ...properties,
        pageId,
        type: "CHART",
        chart: {
          pageId,
          tableId,
          labelColumnId,
          ...getBackgroundProperties(background),
          series: {
            createMany: {
              data: series.map((columnId) => ({
                columnId,
              })),
            },
          },
        },
      },
      { chart: { select: CHART_FIELDS } },
      transaction,
    );

    return { ...tile, ...chart };
  });
}

export async function updateChart({
  pageId,
  id,
  labelColumnId,
  background,
}: UpdateChartSchema) {
  const chart = await prisma.$transaction(async (transaction) => {
    if (labelColumnId) {
      const { tableId } = await transaction.chart.findUniqueOrThrow({
        where: { id, pageId },
        select: { tableId: true },
      });
      await transaction.tableColumn.findUniqueOrThrow({
        where: { id: labelColumnId, tableId },
        select: { id: true },
      });
    }

    return transaction.chart.update({
      where: {
        pageId,
        id,
      },
      data: {
        labelColumnId,
        ...getBackgroundProperties(background),
      },
      select: CHART_FIELDS,
    });
  });
  return { type: "CHART" as const, ...chart };
}

export async function addSeries({
  pageId,
  chartId,
  columnId,
  type,
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
        type,
      },
      select: CHART_SERIES_FIELDS,
    });
  });
}

export async function updateSeries({
  pageId,
  chartId,
  seriesId,
  type,
}: UpdateSeriesSchema) {
  return prisma.$transaction(async (transaction) => {
    // Verify access to the chart
    await transaction.chart.findUniqueOrThrow({
      where: { id: chartId, pageId },
      select: { id: true },
    });

    return transaction.chartSeries.update({
      data: {
        type,
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
