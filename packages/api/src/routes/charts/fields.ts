import prisma, { type ExtensionArgs } from "@/database/prisma";
import type { Prisma } from "@/generated/prisma/client";

export const CHART_SERIES_FIELDS = {
  id: true,
  type: true,
  fill: true,
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
