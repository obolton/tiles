import type { TableColumn, TableRow } from "@/models/Table";
import type { Action } from "./base";
import type { TileActionData } from "./tile";

// Row actions

// Insert a single row
export interface InsertRowData extends TileActionData {
  afterRowId: string | null;
  row: TableRow;
}

export interface InsertRowAction extends Action<
  "table.insertRow",
  InsertRowData
> {}

// Delete a single row by ID
export interface DeleteRowData extends TileActionData {
  rowId: string;
}

export interface DeleteRowAction extends Action<
  "table.deleteRow",
  DeleteRowData
> {}

// Restore a row at a position (reverse of delete)
export interface RestoreRowData extends TileActionData {
  afterRowId: string | null;
  row: TableRow;
}

export interface RestoreRowAction extends Action<
  "table.restoreRow",
  RestoreRowData
> {}

// Move row - symmetric
export interface MoveRowData extends TileActionData {
  rowId: string;
  afterRowId: string | null;
}

export interface MoveRowAction extends Action<"table.moveRow", MoveRowData> {}

// Set row properties - symmetric
export interface SetRowPropertiesData extends TileActionData {
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
export interface InsertColumnData extends TileActionData {
  afterColumnId: string | null;
  column: TableColumn;
}

export interface InsertColumnAction extends Action<
  "table.insertColumn",
  InsertColumnData
> {}

// Delete a single column by ID
export interface DeleteColumnData extends TileActionData {
  columnId: string;
}

export interface DeleteColumnAction extends Action<
  "table.deleteColumn",
  DeleteColumnData
> {}

// Restore a column at a position (reverse of delete)
export interface RestoreColumnData extends TileActionData {
  afterColumnId: string | null;
  column: TableColumn;
}

export interface RestoreColumnAction extends Action<
  "table.restoreColumn",
  RestoreColumnData
> {}

// Move column - symmetric
export interface MoveColumnData extends TileActionData {
  columnId: string;
  afterColumnId: string | null;
}

export interface MoveColumnAction extends Action<
  "table.moveColumn",
  MoveColumnData
> {}

// Set column properties - symmetric
export interface SetColumnPropertiesData extends TileActionData {
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
export interface SetCellData extends TileActionData {
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
