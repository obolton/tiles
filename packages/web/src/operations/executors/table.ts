import Table from "@/models/Table";
import type {
  InsertRowAction,
  DeleteRowAction,
  RestoreRowAction,
  MoveRowAction,
  SetRowPropertiesAction,
  InsertColumnAction,
  DeleteColumnAction,
  RestoreColumnAction,
  MoveColumnAction,
  SetColumnPropertiesAction,
  SetCellAction,
} from "../types";
import type { ActionExecutor } from "./types";

// Row actions

const insertRow: ActionExecutor<InsertRowAction> = async (
  editor,
  { tableId, afterRowId, row },
) => {
  const table = editor.getTileAs(tableId, Table);
  const afterIndex = table.rows.findIndex((r) => r.id === afterRowId);
  table.rows.splice(afterIndex + 1, 0, row);
  table.numRows.value++;
};

const deleteRow: ActionExecutor<DeleteRowAction> = async (
  editor,
  { tableId, rowId },
) => {
  const table = editor.getTileAs(tableId, Table);
  table.rows.value = table.rows.value.filter((r) => r.id !== rowId);
  table.numRows.value--;
};

const restoreRow: ActionExecutor<RestoreRowAction> = async (
  editor,
  { tableId, afterRowId, row },
) => {
  const table = editor.getTileAs(tableId, Table);
  const afterIndex = afterRowId
    ? table.rows.findIndex((r) => r.id === afterRowId)
    : -1;
  table.rows.splice(afterIndex + 1, 0, row);
  table.numRows.value++;
};

const moveRow: ActionExecutor<MoveRowAction> = async (
  editor,
  { tableId, rowId, afterRowId },
) => {
  const table = editor.getTileAs(tableId, Table);
  const row = table.rows.find((r) => r.id === rowId);
  if (!row) {
    return;
  }

  table.rows.value = table.rows.value.filter((r) => r.id !== rowId);
  const afterIndex = afterRowId
    ? table.rows.findIndex((r) => r.id === afterRowId)
    : -1;
  table.rows.splice(afterIndex + 1, 0, row);
};

const setRowProperties: ActionExecutor<SetRowPropertiesAction> = async (
  editor,
  { tableId, rowId, changes },
) => {
  const table = editor.getTileAs(tableId, Table);
  const row = table.rows.find((r) => r.id === rowId);
  if (row && changes.height !== undefined) {
    row.height = changes.height;
  }
};

// Column actions

const insertColumn: ActionExecutor<InsertColumnAction> = async (
  editor,
  { tableId, afterColumnId, column },
) => {
  const table = editor.getTileAs(tableId, Table);
  const afterIndex = table.columns.findIndex((c) => c.id === afterColumnId);
  table.columns.splice(afterIndex + 1, 0, column);
};

const deleteColumn: ActionExecutor<DeleteColumnAction> = async (
  editor,
  { tableId, columnId },
) => {
  const table = editor.getTileAs(tableId, Table);
  table.columns.value = table.columns.value.filter((c) => c.id !== columnId);
};

const restoreColumn: ActionExecutor<RestoreColumnAction> = async (
  editor,
  { tableId, afterColumnId, column },
) => {
  const table = editor.getTileAs(tableId, Table);
  const afterIndex = afterColumnId
    ? table.columns.findIndex((c) => c.id === afterColumnId)
    : -1;
  table.columns.splice(afterIndex + 1, 0, column);
};

const moveColumn: ActionExecutor<MoveColumnAction> = async (
  editor,
  { tableId, columnId, afterColumnId },
) => {
  const table = editor.getTileAs(tableId, Table);
  const column = table.columns.find((c) => c.id === columnId);
  if (!column) {
    return;
  }

  table.columns.value = table.columns.value.filter((c) => c.id !== columnId);
  const afterIndex = afterColumnId
    ? table.columns.findIndex((c) => c.id === afterColumnId)
    : -1;
  table.columns.splice(afterIndex + 1, 0, column);
};

const setColumnProperties: ActionExecutor<SetColumnPropertiesAction> = async (
  editor,
  { tableId, columnId, changes },
) => {
  const table = editor.getTileAs(tableId, Table);
  const column = table.columns.find((c) => c.id === columnId);
  if (column) {
    if (changes.title !== undefined) {
      column.title = changes.title;
    }
    if (changes.width !== undefined) {
      column.width = changes.width;
    }
  }
};

// Cell actions

const setCell: ActionExecutor<SetCellAction> = async (
  editor,
  { tableId, rowId, columnId, content },
) => {
  const table = editor.getTileAs(tableId, Table);
  const row = table.rows.find((r) => r.id === rowId);
  if (row) {
    row.data[columnId] = content;
  }
};

export const executors = {
  "table.insertRow": insertRow,
  "table.deleteRow": deleteRow,
  "table.restoreRow": restoreRow,
  "table.moveRow": moveRow,
  "table.setRowProperties": setRowProperties,
  "table.insertColumn": insertColumn,
  "table.deleteColumn": deleteColumn,
  "table.restoreColumn": restoreColumn,
  "table.moveColumn": moveColumn,
  "table.setColumnProperties": setColumnProperties,
  "table.setCell": setCell,
} as const;
