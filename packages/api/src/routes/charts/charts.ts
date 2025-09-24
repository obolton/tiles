import prisma, { type ExtensionArgs } from "@/database/prisma.ts";
import { createTilePlacement } from "../tiles/tiles.ts";
import { getBackgroundProperties } from "@/utils/backgrounds.ts";
import type { CreateChartSchema, UpdateChartSchema } from "./schema.ts";
import type { Prisma } from "@prisma/client";

export const CHART_FIELDS = {
  id: true,
  chartType: true,
  background: true,
} as const satisfies Prisma.ChartSelect<ExtensionArgs>;

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
}: CreateChartSchema) {
  return prisma.$transaction(async (transaction) => {
    const chart = await transaction.chart.create({
      data: {
        pageId,
        chartType,
        ...getBackgroundProperties(background),
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
