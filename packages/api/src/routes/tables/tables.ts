import { generateKeyBetween, generateNKeysBetween } from "fractional-indexing";
import prisma, { type ExtensionArgs } from "@/database/prisma";
import { createTile } from "../tiles/tiles";
import { getBackgroundProperties } from "@/utils/backgrounds";
import type { Prisma } from "@/generated/prisma/client";
import type { PrismaTransactionClient } from "@/database/prisma";
import type {
  CreateTableSchema,
  UpdateTableSchema,
  InsertRowSchema,
  UpdateRowSchema,
  MoveRowSchema,
  DeleteRowsSchema,
  InsertColumnSchema,
  MoveColumnSchema,
  UpdateColumnSchema,
  DeleteColumnsSchema,
  UpdateCellSchema,
  ClearRangesSchema,
} from "./schema";
import type { ColorSchema } from "@/schema/Color";

export const TABLE_COLUMN_FIELDS = {
  id: true,
  title: true,
  width: true,
} as const satisfies Prisma.TableColumnSelect<ExtensionArgs>;

export const TABLE_ROW_FIELDS = {
  id: true,
  height: true,
  data: true,
} as const satisfies Prisma.TableRowSelect<ExtensionArgs>;

export const TABLE_FIELDS = {
  id: true,
  textColor: true,
  background: true,
} as const satisfies Prisma.TableSelect<ExtensionArgs>;

export const TABLE_WITH_DATA_FIELDS = {
  ...TABLE_FIELDS,
  _count: {
    select: {
      rows: true,
    },
  },
  columns: {
    select: TABLE_COLUMN_FIELDS,
    orderBy: {
      order: "asc",
    },
  },
  rows: {
    select: TABLE_ROW_FIELDS,
    orderBy: {
      order: "asc",
    },
    take: 10,
  },
} as const satisfies Prisma.TableSelect<ExtensionArgs>;

export type TableWithData = Omit<
  Prisma.Result<
    typeof prisma.table,
    { select: typeof TABLE_WITH_DATA_FIELDS },
    "findUniqueOrThrow"
  >,
  "_count"
> & { numRows: number };

function getTextColorProperties(
  textColor?: ColorSchema | null,
): Pick<Prisma.TableCreateInput, "textColor"> {
  if (typeof textColor === "undefined" || textColor === null) {
    return { textColor };
  }
  return { textColor: new Uint8Array(Buffer.from(textColor, "hex")) };
}

export async function createTable({
  pageId,
  columns,
  rows,
  textColor,
  background,
  ...properties
}: CreateTableSchema) {
  const columnData: Prisma.TableColumnCreateManyTableInput[] = [];
  const columnOrderKeys = generateNKeysBetween(null, null, columns);
  for (let i = 0; i < columns; i++) {
    columnData.push({ order: columnOrderKeys[i]! });
  }

  const rowData: Prisma.TableRowCreateManyTableInput[] = [];
  const rowOrderKeys = generateNKeysBetween(null, null, rows);
  for (let i = 0; i < rows; i++) {
    rowData.push({ order: rowOrderKeys[i]!, data: {} });
  }

  const { table, ...tile } = await createTile(
    {
      ...properties,
      type: "TABLE",
      pageId,
      table: {
        pageId,
        ...getTextColorProperties(textColor),
        ...getBackgroundProperties(background),
        columns: {
          createMany: {
            data: columnData,
          },
        },
        rows: {
          createMany: {
            data: rowData,
          },
        },
      },
    },
    { table: { select: TABLE_WITH_DATA_FIELDS } } as const,
    prisma,
  );

  // TODO: Fix type
  const { _count, ...tableWithData } = table;

  return {
    ...tile,
    ...tableWithData,
    numRows: _count.rows,
  };
}

export async function updateTable({
  pageId,
  id,
  textColor,
  background,
}: UpdateTableSchema) {
  const table = await prisma.table.update({
    where: {
      pageId,
      id,
    },
    data: {
      ...getTextColorProperties(textColor),
      ...getBackgroundProperties(background),
    },
    select: TABLE_FIELDS,
  });
  return { type: "TABLE" as const, ...table };
}

export async function getRowOrderKeys(
  transaction: PrismaTransactionClient,
  tableId: string,
  rowId: string | null,
): Promise<[string | null, string | null]> {
  if (rowId === null) {
    const [row] = await transaction.$queryRaw<
      { order: string }[]
    >`SELECT "order" FROM table_rows WHERE table_id = ${tableId}::uuid ORDER BY "order" ASC LIMIT 1;`;
    return [null, row?.order ?? null];
  }

  const [result] = await transaction.$queryRaw<
    { a: string; b: string | null }[]
  >`SELECT row_a."order" AS a, row_b."order" AS b
  FROM table_rows AS row_a
  LEFT JOIN LATERAL (
    SELECT "order" FROM table_rows
    WHERE table_id = ${tableId}::uuid AND "order" > row_a."order"
    ORDER BY "order" ASC
    LIMIT 1
  ) AS row_b ON true
  WHERE row_a.table_id = ${tableId}::uuid AND row_a.id = ${rowId}::uuid;`;
  return [result?.a ?? null, result?.b ?? null];
}

export async function insertRow({
  pageId,
  tableId,
  height,
  afterRowId,
}: InsertRowSchema) {
  return prisma.$transaction(async (transaction) => {
    // Verify access to the table
    await transaction.table.findUniqueOrThrow({
      where: { id: tableId, pageId },
      select: { id: true },
    });

    const [keyA, keyB] = await getRowOrderKeys(
      transaction,
      tableId,
      afterRowId,
    );
    const order = generateKeyBetween(keyA, keyB);

    return transaction.tableRow.create({
      data: {
        tableId,
        order,
        height,
        data: {},
      },
      select: TABLE_ROW_FIELDS,
    });
  });
}

export async function updateRow({
  pageId,
  tableId,
  rowId,
  height,
}: UpdateRowSchema) {
  return prisma.$transaction(async (transaction) => {
    // Verify access to the table
    await transaction.table.findUniqueOrThrow({
      where: { id: tableId, pageId },
      select: { id: true },
    });

    return transaction.tableRow.update({
      where: {
        id: rowId,
        tableId,
      },
      data: {
        height,
      },
      select: TABLE_ROW_FIELDS,
    });
  });
}

export async function moveRow({
  pageId,
  tableId,
  rowId,
  afterRowId,
}: MoveRowSchema) {
  return prisma.$transaction(async (transaction) => {
    // Verify access to the table
    await transaction.table.findUniqueOrThrow({
      where: { id: tableId, pageId },
      select: { id: true },
    });

    const [keyA, keyB] = await getRowOrderKeys(
      transaction,
      tableId,
      afterRowId,
    );
    const order = generateKeyBetween(keyA, keyB);

    return transaction.tableRow.update({
      where: {
        id: rowId,
        tableId,
      },
      data: {
        order,
      },
      select: TABLE_ROW_FIELDS,
    });
  });
}

export async function deleteRows({
  pageId,
  tableId,
  rowIds,
}: DeleteRowsSchema) {
  return prisma.$transaction(async (transaction) => {
    // Verify access to the table
    await transaction.table.findUniqueOrThrow({
      where: { id: tableId, pageId },
      select: { id: true },
    });

    return transaction.tableRow.deleteMany({
      where: {
        tableId,
        id: { in: rowIds },
      },
    });
  });
}

export async function getColumnOrderKeys(
  transaction: PrismaTransactionClient,
  tableId: string,
  columnId: string | null,
): Promise<[string | null, string | null]> {
  if (columnId === null) {
    const [column] = await transaction.$queryRaw<
      [{ order: string | null }]
    >`SELECT "order" FROM table_columns WHERE table_id = ${tableId}::uuid ORDER BY "order" ASC LIMIT 1;`;
    return [null, column?.order ?? null];
  }

  const [result] = await transaction.$queryRaw<
    { a: string; b: string | null }[]
  >`SELECT column_a."order" AS a, column_b."order" AS b
  FROM table_columns AS column_a
  LEFT JOIN LATERAL (
    SELECT "order" FROM table_columns
    WHERE table_id = ${tableId}::uuid AND "order" > column_a."order"
    ORDER BY "order" ASC
    LIMIT 1
  ) AS column_b ON true
  WHERE column_a.table_id = ${tableId}::uuid AND column_a.id = ${columnId}::uuid;`;
  return [result?.a ?? null, result?.b ?? null];
}

export async function insertColumn({
  pageId,
  tableId,
  title,
  width,
  afterColumnId,
}: InsertColumnSchema) {
  return prisma.$transaction(async (transaction) => {
    // Verify access to the table
    await transaction.table.findUniqueOrThrow({
      where: { id: tableId, pageId },
      select: { id: true },
    });

    const [keyA, keyB] = await getColumnOrderKeys(
      transaction,
      tableId,
      afterColumnId,
    );
    const order = generateKeyBetween(keyA, keyB);

    return transaction.tableColumn.create({
      data: {
        tableId,
        order,
        title,
        width,
      },
      select: TABLE_COLUMN_FIELDS,
    });
  });
}

export async function moveColumn({
  pageId,
  tableId,
  columnId,
  afterColumnId,
}: MoveColumnSchema) {
  return prisma.$transaction(async (transaction) => {
    // Verify access to the table
    await transaction.table.findUniqueOrThrow({
      where: { id: tableId, pageId },
      select: { id: true },
    });

    const [keyA, keyB] = await getColumnOrderKeys(
      transaction,
      tableId,
      afterColumnId,
    );
    const order = generateKeyBetween(keyA, keyB);

    return transaction.tableColumn.update({
      where: {
        id: columnId,
        tableId,
      },
      data: {
        order,
      },
      select: TABLE_COLUMN_FIELDS,
    });
  });
}

export async function updateColumn({
  pageId,
  tableId,
  columnId,
  title,
  width,
}: UpdateColumnSchema) {
  return prisma.$transaction(async (transaction) => {
    // Verify access to the table
    await transaction.table.findUniqueOrThrow({
      where: { id: tableId, pageId },
      select: { id: true },
    });

    return transaction.tableColumn.update({
      where: {
        id: columnId,
        tableId,
      },
      data: {
        title,
        width,
      },
      select: TABLE_COLUMN_FIELDS,
    });
  });
}

export async function deleteColumns({
  pageId,
  tableId,
  columnIds,
}: DeleteColumnsSchema) {
  return prisma.$transaction(async (transaction) => {
    // Verify access to the table
    await transaction.table.findUniqueOrThrow({
      where: { id: tableId, pageId },
      select: { id: true },
    });

    await transaction.tableColumn.deleteMany({
      where: {
        tableId,
        id: { in: columnIds },
      },
    });

    // Remove the column data
    await transaction.$executeRaw`UPDATE table_rows
    SET data = data - ${columnIds}
    WHERE table_id = ${tableId}::uuid AND data ?| ${columnIds};`;
  });
}

export async function updateCell({
  pageId,
  tableId,
  rowId,
  columnId,
  value,
}: UpdateCellSchema) {
  return prisma.$transaction(async (transaction) => {
    // Verify access to the table
    await transaction.table.findUniqueOrThrow({
      where: { id: tableId, pageId },
      select: { id: true },
    });

    // Verify existence of column
    await transaction.tableColumn.findUniqueOrThrow({
      where: { tableId, id: columnId },
      select: { id: true },
    });

    const stringValue = JSON.stringify(value);

    return transaction.$executeRaw`UPDATE "table_rows"
    SET "data" = jsonb_set("data", ARRAY[${columnId}], ${stringValue}::jsonb, true)
    WHERE "id" = ${rowId}::uuid AND "table_id" = ${tableId}::uuid;`;
  });
}

export async function clearRanges({
  pageId,
  tableId,
  ranges,
}: ClearRangesSchema) {
  return prisma.$transaction(async (transaction) => {
    // Verify access to the table
    await transaction.table.findUniqueOrThrow({
      where: { id: tableId, pageId },
      select: { id: true },
    });

    await Promise.all(
      ranges.map((range) => {
        switch (range.type) {
          case "cells":
            return transaction.$executeRaw`WITH
"from_column" AS (SELECT "order" FROM table_columns WHERE table_id = ${tableId}::uuid AND id = ${range.from.column}::uuid),
"to_column" AS (SELECT "order" FROM table_columns WHERE table_id = ${tableId}::uuid AND id = ${range.to.column}::uuid),
"column_ids" AS (
  SELECT id FROM table_columns
  WHERE "table_id" = ${tableId}::uuid
  AND "order" >= (SELECT "order" FROM "from_column")
  AND "order" <= (SELECT "order" FROM "to_column")
)
UPDATE "table_rows"
SET "data" = "data" - (SELECT COALESCE(array_agg(id::text), ARRAY[]::text[]) FROM "column_ids")
WHERE "table_id" = ${tableId}::uuid
AND "order" >= (SELECT "order" FROM table_rows WHERE table_id = ${tableId}::uuid AND id = ${range.from.row}::uuid)
AND "order" <= (SELECT "order" FROM table_rows WHERE table_id = ${tableId}::uuid AND id = ${range.to.row}::uuid);`;

          case "columns":
            return transaction.$executeRaw`WITH
"from_column" AS (SELECT "order" FROM table_columns WHERE table_id = ${tableId}::uuid AND id = ${range.from}::uuid),
"to_column" AS (SELECT "order" FROM table_columns WHERE table_id = ${tableId}::uuid AND id = ${range.to}::uuid),
"column_ids" AS (
  SELECT id FROM table_columns
  WHERE "table_id" = ${tableId}::uuid
  AND "order" >= (SELECT "order" FROM "from_column")
  AND "order" <= (SELECT "order" FROM "to_column")
)
UPDATE "table_rows"
SET "data" = "data" - (SELECT COALESCE(array_agg(id::text), ARRAY[]::text[]) FROM "column_ids")
WHERE "table_id" = ${tableId}::uuid;`;

          case "rows":
            return transaction.$executeRaw`UPDATE table_rows
SET "data" = '{}'::jsonb
WHERE "table_id" = ${tableId}::uuid
AND "order" >= (SELECT "order" FROM table_rows WHERE table_id = ${tableId}::uuid AND id = ${range.from}::uuid)
AND "order" <= (SELECT "order" FROM table_rows WHERE table_id = ${tableId} ::uuid AND id = ${range.to}::uuid);`;
        }
      }),
    );
  });
}
