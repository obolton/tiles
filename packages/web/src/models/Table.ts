import * as Y from "yjs";
import { orderedEntries, orderAfter } from "doc/placement/ordering";
import {
  buildTableMap,
  buildColumn,
  buildRow,
  clearRowCells,
  getCell,
  idsInRange,
  type TableMapInput,
} from "doc/tiles/table";
import Tile from "./Tile";
import Column from "./Column";
import Row, { type CellValue } from "./Row";
import SharedList from "@/collaboration/SharedList";
import { createId } from "doc/id";
import YReactive from "@/collaboration/YReactive";
import { combine, isReactive, type Reactive } from "reactivity";
import type Page from "@/models/Page";

export type { CellValue };

export interface UpdateCellInput {
  rowId: string;
  columnId: string;
  value: CellValue;
}

interface CellRange {
  type: "cells";
  from: { row: string; column: string };
  to: { row: string; column: string };
}

interface RowRange {
  type: "rows";
  from: string;
  to: string;
}

interface ColumnRange {
  type: "columns";
  from: string;
  to: string;
}

export type TableRange = CellRange | RowRange | ColumnRange;

export default class Table extends Tile {
  readonly type = "TABLE";

  readonly columns: SharedList<Column>;
  readonly rows: SharedList<Row>;

  private readonly columnsMap: Y.Map<Y.Map<unknown>>;
  private readonly rowsMap: Y.Map<Y.Map<unknown>>;
  private readonly rowsContent: YReactive<Y.Map<Y.Map<unknown>>>;

  static async create(page: Page, data: TableMapInput): Promise<Table> {
    const { parentId, beforeId, at, ...rest } = data;
    const map = buildTableMap(rest);
    const table = page.createTile(map, { parentId, beforeId, at }) as Table;
    table.editor.addTile(table);
    return table;
  }

  constructor(page: Page, map: Y.Map<unknown>) {
    super(page, map);

    const columnsMap = map.get("columns");
    const rowsMap = map.get("rows");
    if (!(columnsMap instanceof Y.Map) || !(rowsMap instanceof Y.Map)) {
      throw new Error("Table tile missing columns or rows");
    }
    this.columnsMap = columnsMap as Y.Map<Y.Map<unknown>>;
    this.rowsMap = rowsMap as Y.Map<Y.Map<unknown>>;
    this.rowsContent = new YReactive(this.rowsMap);

    this.columns = new SharedList(this.columnsMap, (id, columnMap) => new Column(id, columnMap));
    this.rows = new SharedList(this.rowsMap, (id, rowMap) => new Row(id, rowMap));
  }

  /** The column's cells in row order; empty for a `null` column id. */
  getColumnData(columnId: string | Reactive<string | null>): Reactive<CellValue[]> {
    if (!isReactive(columnId)) {
      return this.rowsContent.derive((rows) => this.getCells(rows, columnId));
    }
    return combine({ columnId, rows: this.rowsContent }, ({ columnId, rows }) =>
      columnId === null ? [] : this.getCells(rows, columnId),
    );
  }

  private getCells(rows: Y.Map<Y.Map<unknown>>, columnId: string): CellValue[] {
    return orderedEntries(rows).map(({ map }) => getCell(map, columnId) as CellValue);
  }

  // Columns

  insertColumn(afterColumnId: string | null): Column {
    const id = createId();
    this.page.doc.transact(() => {
      const order = orderAfter(orderedEntries(this.columnsMap), afterColumnId);
      this.columnsMap.set(id, buildColumn(order));
    });
    return this.columns.get(id);
  }

  moveColumn(id: string, afterId: string | null) {
    this.page.doc.transact(() => {
      const siblings = orderedEntries(this.columnsMap).filter((e) => e.id !== id);
      this.columnsMap.get(id)?.set("order", orderAfter(siblings, afterId));
    });
  }

  removeColumns(ids: string[]) {
    if (ids.length === 0) {
      return;
    }
    this.page.doc.transact(() => {
      for (const id of ids) {
        this.columns.remove(id);
      }
      // Drop the deleted columns' cells from every row.
      for (const { map } of orderedEntries(this.rowsMap)) {
        clearRowCells(map, ids);
      }
    });
  }

  // Rows

  insertRow(afterRowId: string | null): Row {
    const id = createId();
    this.page.doc.transact(() => {
      const order = orderAfter(orderedEntries(this.rowsMap), afterRowId);
      this.rowsMap.set(id, buildRow(order));
    });
    return this.rows.get(id);
  }

  appendRow(): Row {
    const last = orderedEntries(this.rowsMap).at(-1)?.id ?? null;
    return this.insertRow(last);
  }

  moveRow(id: string, afterId: string | null) {
    this.page.doc.transact(() => {
      const siblings = orderedEntries(this.rowsMap).filter((e) => e.id !== id);
      this.rowsMap.get(id)?.set("order", orderAfter(siblings, afterId));
    });
  }

  removeRows(ids: string[]) {
    if (ids.length === 0) {
      return;
    }
    this.page.doc.transact(() => {
      for (const id of ids) {
        this.rows.remove(id);
      }
    });
  }

  // Cells

  updateCell({ rowId, columnId, value }: UpdateCellInput) {
    this.page.doc.transact(() => {
      const cells = this.rowsMap.get(rowId)?.get("cells");
      if (!(cells instanceof Y.Map)) {
        return;
      }
      if (value == null || value === "") {
        cells.delete(columnId);
      } else {
        cells.set(columnId, value);
      }
    });
  }

  clearRanges({ ranges }: { ranges: TableRange[] }) {
    const columnIds = orderedEntries(this.columnsMap).map((entry) => entry.id);
    const rows = orderedEntries(this.rowsMap);
    const rowIds = rows.map((entry) => entry.id);

    this.page.doc.transact(() => {
      for (const range of ranges) {
        if (range.type === "columns") {
          const targets = idsInRange(columnIds, range.from, range.to);
          for (const { map } of rows) {
            clearRowCells(map, targets);
          }
        } else if (range.type === "rows") {
          const targets = new Set(idsInRange(rowIds, range.from, range.to));
          for (const { id, map } of rows) {
            if (targets.has(id)) {
              clearRowCells(map);
            }
          }
        } else {
          const targetRows = new Set(idsInRange(rowIds, range.from.row, range.to.row));
          const targetColumns = idsInRange(columnIds, range.from.column, range.to.column);
          for (const { id, map } of rows) {
            if (targetRows.has(id)) {
              clearRowCells(map, targetColumns);
            }
          }
        }
      }
    });
  }

  dispose() {
    this.columns.dispose();
    this.rows.dispose();
    super.dispose();
  }
}
