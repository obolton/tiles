import prisma from "@/database/prisma";
import { createTile } from "../tiles/tiles";
import type { CreateChartSchema } from "./schema";
import type { BackgroundSchema } from "@/schema/Background";
import { getBackgroundProperties } from "@/utils/themes";
import { CHART_FIELDS } from "./fields";

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
