import prisma, { type ExtensionArgs } from "@/database/prisma.ts";
import { createTilePlacement } from "../tiles/tiles.ts";
import type { Prisma } from "@prisma/client";
import type {
  CreateTableSchema,
  UpdateTableSchema,
  AppendRowSchema,
  DeleteRowSchema,
  UpdateCellSchema,
} from "./schema.ts";

export const TABLE_ROW_FIELDS = {
  id: true,
  data: true,
} as const satisfies Prisma.TableRowSelect<ExtensionArgs>;

export const TABLE_FIELDS = {
  id: true,
  numColumns: true,
} as const satisfies Prisma.TableSelect<ExtensionArgs>;

export const TABLE_WITH_DATA_FIELDS = {
  ...TABLE_FIELDS,
  _count: {
    select: {
      data: true,
    },
  },
  data: {
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
        numColumns,
      },
      select: { id: true },
    });

    const rowData: Prisma.TableRowCreateManyInput[] = [];
    for (let i = 0; i < numRows; i++) {
      rowData.push({ tableId: table.id, data: [] });
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
      numRows: _count.data,
      ...placement,
    };
  });
}

export async function updateTable({
  pageId,
  id,
  numColumns,
}: UpdateTableSchema) {
  const text = await prisma.table.update({
    where: {
      pageId,
      id,
    },
    data: {
      numColumns,
    },
    select: TABLE_FIELDS,
  });
  return { type: "TABLE" as const, ...text };
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
        data: [],
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

export async function updateCell({
  pageId,
  tableId,
  rowId,
  column,
  value,
}: UpdateCellSchema) {
  return prisma.$transaction(async (transaction) => {
    // Verify access to the table
    await transaction.table.findUniqueOrThrow({
      where: { id: tableId, pageId },
      select: { id: true },
    });

    const { data } = await transaction.tableRow.findUniqueOrThrow({
      where: { id: rowId, tableId },
      select: { data: true },
    });

    const rowData = Array.isArray(data) ? data : [];
    rowData[column] = value;

    // TODO: Update column value directly
    // https://github.com/prisma/prisma/issues/5057
    return transaction.tableRow.update({
      where: { id: rowId, tableId },
      data: {
        tableId,
        data: rowData,
      },
      select: TABLE_ROW_FIELDS,
    });
  });
}
