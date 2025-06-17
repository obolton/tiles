import prisma, { type ExtensionArgs } from "@/database/prisma.ts";
import { createTilePlacement } from "../tiles/tiles.ts";
import type { Prisma } from "@prisma/client";
import type {
  CreateTableSchema,
  AppendRowSchema,
  DeleteRowSchema,
  AppendColumnSchema,
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
} as const satisfies Prisma.TableSelect<ExtensionArgs>;

export const TABLE_WITH_DATA_FIELDS = {
  ...TABLE_FIELDS,
  _count: {
    select: {
      tableRows: true,
    },
  },
  tableColumns: {
    select: TABLE_COLUMN_FIELDS,
  },
  tableRows: {
    select: TABLE_ROW_FIELDS,
    take: 10,
  },
} as const satisfies Prisma.TableSelect<ExtensionArgs>;

export async function createTable({
  pageId,
  collectionId,
  numColumns,
  numRows,
}: CreateTableSchema) {
  return prisma.$transaction(async (transaction) => {
    const table = await transaction.table.create({
      data: {
        pageId,
      },
      select: { id: true },
    });

    const columnData: Prisma.TableColumnCreateManyInput[] = [];
    for (let i = 0; i < numColumns; i++) {
      columnData.push({ tableId: table.id });
    }
    await transaction.tableColumn.createMany({
      data: columnData,
    });

    const rowData: Prisma.TableRowCreateManyInput[] = [];
    for (let i = 0; i < numRows; i++) {
      rowData.push({ tableId: table.id, data: {} });
    }
    await transaction.tableRow.createMany({
      data: rowData,
    });

    const placement = await createTilePlacement(
      {
        pageId,
        parentCollectionId: collectionId,
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
      numRows: _count.tableRows,
      ...placement,
    };
  });
}

export async function appendRow({ pageId, tableId }: AppendRowSchema) {
  return prisma.$transaction(async (transaction) => {
    // Verify access to the table
    await transaction.table.findUniqueOrThrow({
      where: { id: tableId, pageId },
      select: { id: true },
    });

    return transaction.tableRow.create({
      data: {
        tableId,
        data: {},
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

export async function appendColumn({
  pageId,
  tableId,
  width,
}: AppendColumnSchema) {
  return prisma.$transaction(async (transaction) => {
    // Verify access to the table
    await transaction.table.findUniqueOrThrow({
      where: { id: tableId, pageId },
      select: { id: true },
    });

    return transaction.tableColumn.create({
      data: {
        tableId,
        width,
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
