import { generateKeyBetween, generateNKeysBetween } from "fractional-indexing";
import prisma, { type ExtensionArgs } from "@/database/prisma.ts";
import { createTilePlacement } from "../tiles/tiles.ts";
import type { Prisma } from "@prisma/client";
import type {
  CreateTableSchema,
  UpdateTableSchema,
  InsertRowSchema,
  MoveRowSchema,
  DeleteRowSchema,
  InsertColumnSchema,
  MoveColumnSchema,
  UpdateColumnSchema,
  DeleteColumnSchema,
  UpdateCellSchema,
} from "./schema.ts";

export const TABLE_COLUMN_FIELDS = {
  id: true,
  width: true,
} as const satisfies Prisma.TableColumnSelect<ExtensionArgs>;

export const TABLE_ROW_FIELDS = {
  id: true,
  data: true,
} as const satisfies Prisma.TableRowSelect<ExtensionArgs>;

export const TABLE_FIELDS = {
  id: true,
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

export async function createTable({
  pageId,
  sectionId,
  columns,
  rows,
  background,
}: CreateTableSchema) {
  const color = background && "color" in background ? background.color : null;
  const imageKey =
    background && "imageKey" in background ? background.imageKey : null;

  return prisma.$transaction(async (transaction) => {
    const table = await transaction.table.create({
      data: {
        pageId,
        lightness: color?.l,
        chroma: color?.c,
        hue: color?.h,
        imageKey,
      },
      select: { id: true },
    });

    const columnData: Prisma.TableColumnCreateManyInput[] = [];
    const columnOrderKeys = generateNKeysBetween(null, null, columns);
    for (let i = 0; i < columns; i++) {
      columnData.push({ tableId: table.id, order: columnOrderKeys[i]! });
    }
    await transaction.tableColumn.createMany({
      data: columnData,
    });

    const rowData: Prisma.TableRowCreateManyInput[] = [];
    const rowOrderKeys = generateNKeysBetween(null, null, rows);
    for (let i = 0; i < rows; i++) {
      rowData.push({ tableId: table.id, order: rowOrderKeys[i]!, data: {} });
    }
    await transaction.tableRow.createMany({
      data: rowData,
    });

    const placement = await createTilePlacement(
      {
        pageId,
        sectionId,
        type: "TABLE",
        tableId: table.id,
      },
      transaction,
    );

    const { _count, ...tableWithData } =
      await transaction.table.findUniqueOrThrow({
        where: { id: table.id, pageId },
        select: TABLE_WITH_DATA_FIELDS,
      });

    return {
      type: "TABLE" as const,
      ...tableWithData,
      numRows: _count.rows,
      ...placement,
    };
  });
}

export async function updateTable({
  pageId,
  id,
  background,
}: UpdateTableSchema) {
  const color = background && "color" in background ? background.color : null;
  const imageKey =
    background && "imageKey" in background ? background.imageKey : null;

  const table = await prisma.table.update({
    where: {
      pageId,
      id,
    },
    data: {
      lightness:
        typeof background !== "undefined"
          ? color
            ? color.l
            : null
          : undefined,
      chroma:
        typeof background !== "undefined"
          ? color
            ? color.c
            : null
          : undefined,
      hue:
        typeof background !== "undefined"
          ? color
            ? color.h
            : null
          : undefined,
      imageKey: typeof background !== "undefined" ? imageKey : undefined,
    },
    select: TABLE_FIELDS,
  });
  return { type: "TABLE" as const, ...table };
}

export async function getRowOrderKeys(
  tableId: string,
  rowId: string | null,
): Promise<[string | null, string | null]> {
  if (rowId === null) {
    const [row] = await prisma.$queryRaw<
      { order: string }[]
    >`SELECT "order" FROM table_rows WHERE table_id = ${tableId}::uuid ORDER BY "order" ASC LIMIT 1;`;
    return [null, row?.order ?? null];
  }

  const [result] = await prisma.$queryRaw<
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
  afterRowId,
}: InsertRowSchema) {
  return prisma.$transaction(async (transaction) => {
    // Verify access to the table
    await transaction.table.findUniqueOrThrow({
      where: { id: tableId, pageId },
      select: { id: true },
    });

    const [keyA, keyB] = await getRowOrderKeys(tableId, afterRowId);
    const order = generateKeyBetween(keyA, keyB);

    return transaction.tableRow.create({
      data: {
        tableId,
        order,
        data: {},
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

    const [keyA, keyB] = await getRowOrderKeys(tableId, afterRowId);
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

export async function deleteRow({ pageId, tableId, rowId }: DeleteRowSchema) {
  return prisma.$transaction(async (transaction) => {
    // Verify access to the table
    await transaction.table.findUniqueOrThrow({
      where: { id: tableId, pageId },
      select: { id: true },
    });

    return transaction.tableRow.delete({
      where: {
        tableId,
        id: rowId,
      },
      select: { id: true },
    });
  });
}

export async function getColumnOrderKeys(
  tableId: string,
  columnId: string | null,
): Promise<[string | null, string | null]> {
  if (columnId === null) {
    const [column] = await prisma.$queryRaw<
      [{ order: string | null }]
    >`SELECT "order" FROM table_columns WHERE table_id = ${tableId}::uuid ORDER BY "order" ASC LIMIT 1;`;
    return [null, column?.order ?? null];
  }

  const [result] = await prisma.$queryRaw<
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
  width,
  afterColumnId,
}: InsertColumnSchema) {
  return prisma.$transaction(async (transaction) => {
    // Verify access to the table
    await transaction.table.findUniqueOrThrow({
      where: { id: tableId, pageId },
      select: { id: true },
    });

    const [keyA, keyB] = await getColumnOrderKeys(tableId, afterColumnId);
    const order = generateKeyBetween(keyA, keyB);

    return transaction.tableColumn.create({
      data: {
        tableId,
        order,
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

    const [keyA, keyB] = await getColumnOrderKeys(tableId, afterColumnId);
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
        width,
      },
      select: TABLE_COLUMN_FIELDS,
    });
  });
}

export async function deleteColumn({
  pageId,
  tableId,
  columnId,
}: DeleteColumnSchema) {
  return prisma.$transaction(async (transaction) => {
    // Verify access to the table
    await transaction.table.findUniqueOrThrow({
      where: { id: tableId, pageId },
      select: { id: true },
    });

    await transaction.tableColumn.delete({
      where: {
        tableId,
        id: columnId,
      },
      select: { id: true },
    });

    // Remove the column data
    await transaction.$executeRaw`UPDATE "table_rows"
    SET "data" = data - ${columnId}::text
    WHERE "table_id" = ${tableId}::uuid;`;
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
