import { Buffer } from "node:buffer";
import prisma from "@/database/prisma";
import { createTile } from "../tiles/tiles";
import { getBackgroundProperties } from "@/utils/backgrounds";
import type {
  CreateChartSchema,
  UpdateChartSchema,
  AddSeriesSchema,
  UpdateSeriesSchema,
  DeleteSeriesSchema,
} from "./schema";
import type { BackgroundSchema } from "@/schema/Background";
import { CHART_FIELDS, CHART_SERIES_FIELDS } from "./fields";

function getSeriesFillData(fill?: BackgroundSchema) {
  if (typeof fill === "undefined") {
    return {};
  }
  if (fill === null) {
    return { color: null, gradient: null };
  }
  if (fill.type === "color") {
    return {
      color: new Uint8Array(Buffer.from(fill.color, "hex")),
      gradient: null,
    };
  }
  if (fill.type === "gradient") {
    return {
      color: new Uint8Array(Buffer.from(fill.colorA + fill.colorB, "hex")),
      gradient: fill.direction,
    };
  }
  // Ignore 'image' type for series
  return {};
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
        chart: {
          pageId,
          tableId,
          labelColumnId,
          ...getBackgroundProperties(background),
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
