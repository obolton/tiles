import type { TableColumn, TableRow } from "@/models/Table";
import type { Action } from "./base";

// Row actions

// Insert a single row
export interface InsertRowData {
  tableId: string;
  afterRowId: string | null;
  row: TableRow;
}

export interface InsertRowAction extends Action<
  "table.insertRow",
  InsertRowData
> {}

// Delete a single row by ID
export interface DeleteRowData {
  tableId: string;
  rowId: string;
}

export interface DeleteRowAction extends Action<
  "table.deleteRow",
  DeleteRowData
> {}

// Restore a row at a position (reverse of delete)
export interface RestoreRowData {
  tableId: string;
  afterRowId: string | null;
  row: TableRow;
}

export interface RestoreRowAction extends Action<
  "table.restoreRow",
  RestoreRowData
> {}

// Move row - symmetric
export interface MoveRowData {
  tableId: string;
  rowId: string;
  afterRowId: string | null;
}

export interface MoveRowAction extends Action<"table.moveRow", MoveRowData> {}

// Set row properties - symmetric
export interface SetRowPropertiesData {
  tableId: string;
  rowId: string;
  changes: {
    height?: number;
  };
}

export interface SetRowPropertiesAction extends Action<
  "table.setRowProperties",
  SetRowPropertiesData
> {}

// Column actions

// Insert a single column
export interface InsertColumnData {
  tableId: string;
  afterColumnId: string | null;
  column: TableColumn;
}

export interface InsertColumnAction extends Action<
  "table.insertColumn",
  InsertColumnData
> {}

// Delete a single column by ID
export interface DeleteColumnData {
  tableId: string;
  columnId: string;
}

export interface DeleteColumnAction extends Action<
  "table.deleteColumn",
  DeleteColumnData
> {}

// Restore a column at a position (reverse of delete)
export interface RestoreColumnData {
  tableId: string;
  afterColumnId: string | null;
  column: TableColumn;
}

export interface RestoreColumnAction extends Action<
  "table.restoreColumn",
  RestoreColumnData
> {}

// Move column - symmetric
export interface MoveColumnData {
  tableId: string;
  columnId: string;
  afterColumnId: string | null;
}

export interface MoveColumnAction extends Action<
  "table.moveColumn",
  MoveColumnData
> {}

// Set column properties - symmetric
export interface SetColumnPropertiesData {
  tableId: string;
  columnId: string;
  changes: {
    title?: string | null;
    width?: number;
  };
}

export interface SetColumnPropertiesAction extends Action<
  "table.setColumnProperties",
  SetColumnPropertiesData
> {}

// Cell actions

// Set cell content - symmetric
export interface SetCellData {
  tableId: string;
  rowId: string;
  columnId: string;
  content: TableRow["data"][string];
}

export interface SetCellAction extends Action<"table.setCell", SetCellData> {}

export type TableAction =
  | InsertRowAction
  | DeleteRowAction
  | RestoreRowAction
  | MoveRowAction
  | SetRowPropertiesAction
  | InsertColumnAction
  | DeleteColumnAction
  | RestoreColumnAction
  | MoveColumnAction
  | SetColumnPropertiesAction
  | SetCellAction;
