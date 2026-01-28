import type { TableColumn, TableRow } from "@/models/Table";
import type { Operation } from "./base";

// Row operations

export interface TableInsertRowData {
  tableId: string;
  afterRowId: string | null;
  row: TableRow;
}

export interface TableInsertRowInverse {
  tableId: string;
  rowId: string;
}

export interface TableInsertRowOperation extends Operation<
  "table.insertRow",
  TableInsertRowData,
  TableInsertRowInverse
> {}

export interface TableDeleteRowsData {
  tableId: string;
  rowIds: string[];
}

export interface TableDeleteRowsInverse {
  tableId: string;
  /** Rows with their positions for restoration */
  rows: Array<{ row: TableRow; afterRowId: string | null }>;
}

export interface TableDeleteRowsOperation extends Operation<
  "table.deleteRows",
  TableDeleteRowsData,
  TableDeleteRowsInverse
> {}

export interface TableMoveRowData {
  tableId: string;
  rowId: string;
  afterRowId: string | null;
}

export interface TableMoveRowOperation extends Operation<
  "table.moveRow",
  TableMoveRowData
> {}

// Column operations

export interface TableInsertColumnData {
  tableId: string;
  afterColumnId: string | null;
  column: TableColumn;
}

export interface TableInsertColumnInverse {
  tableId: string;
  columnId: string;
}

export interface TableInsertColumnOperation extends Operation<
  "table.insertColumn",
  TableInsertColumnData,
  TableInsertColumnInverse
> {}

export interface TableDeleteColumnsData {
  tableId: string;
  columnIds: string[];
}

export interface TableDeleteColumnsInverse {
  tableId: string;
  /** Columns with their positions for restoration */
  columns: Array<{ column: TableColumn; afterColumnId: string | null }>;
}

export interface TableDeleteColumnsOperation extends Operation<
  "table.deleteColumns",
  TableDeleteColumnsData,
  TableDeleteColumnsInverse
> {}

export interface TableMoveColumnData {
  tableId: string;
  columnId: string;
  afterColumnId: string | null;
}

export interface TableMoveColumnOperation extends Operation<
  "table.moveColumn",
  TableMoveColumnData
> {}

// Cell operations

export interface TableUpdateCellData {
  tableId: string;
  rowId: string;
  columnId: string;
  content: TableRow["data"][string];
}

export interface TableUpdateCellOperation extends Operation<
  "table.updateCell",
  TableUpdateCellData
> {}

export type TableOperation =
  | TableInsertRowOperation
  | TableDeleteRowsOperation
  | TableMoveRowOperation
  | TableInsertColumnOperation
  | TableDeleteColumnsOperation
  | TableMoveColumnOperation
  | TableUpdateCellOperation;
