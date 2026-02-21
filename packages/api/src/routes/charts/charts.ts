import prisma from "@/database/prisma";
import { createTile } from "../tiles/tiles";
import type {
  CreateChartSchema,
  UpdateChartSchema,
  AddSeriesSchema,
  UpdateSeriesSchema,
  DeleteSeriesSchema,
} from "./schema";
import type { BackgroundSchema } from "@/schema/Background";
import { getBackgroundProperties } from "@/utils/themes";
import { CHART_FIELDS, CHART_SERIES_FIELDS } from "./fields";

export async function getTableColumns(pageId: string, tableId: string) {
  return prisma.tableColumn.findMany({
    where: { tableId, table: { pageId } },
    orderBy: { order: "asc" },
    select: { id: true },
  });
}

function getSeriesFillData(fill?: BackgroundSchema | null) {
  const { backgroundColor: color, backgroundGradient: gradient } =
    getBackgroundProperties(fill) ?? {};
  return { color, gradient };
}

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
      series.map((s) =>
        transaction.tableColumn.findUniqueOrThrow({
          where: { id: s.columnId, table: { id: tableId, pageId } },
          select: { id: true },
        }),
      ),
    );

    const { chart, ...tile } = await createTile(
      {
        ...properties,
        pageId,
        type: "CHART",
        background,
        chart: {
          pageId,
          tableId,
          labelColumnId,
          series: {
            createMany: {
              data: series.map((s) => ({
                columnId: s.columnId,
                type: s.type,
                ...getSeriesFillData(s.fill),
              })),
            },
          },
        },
      },
      { chart: { select: CHART_FIELDS } },
      transaction,
    );

    return { ...tile, ...chart! };
  });
}

export async function updateChart({
  pageId,
  id,
  labelColumnId,
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
  fill,
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
        ...getSeriesFillData(fill),
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
  fill,
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
        ...getSeriesFillData(fill),
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
