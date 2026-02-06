import Tile from "./Tile";
import {
  reactive,
  array,
  type Reactive,
  type ReactiveArray,
} from "@/utils/reactivity";
import client from "@/api/client";
import type Editor from "@/editor/Editor";
import type { ClientTableTile } from "api/types/tiles";
import type { Fill, FillUpdate } from "@/components/fills/types";
import type { RichText } from "@/utils/richText/types";
import type { AppRouterInputs } from "@/api/client";

export interface TableColumn {
  id: string;
  width: number;
  title: string | null;
  background: Fill | null;
}

export interface TableRow {
  id: string;
  height: number;
  data: Record<string, RichText | string | null>;
  background: Fill | null;
}

export default class Table extends Tile {
  readonly type = "TABLE";

  readonly columns: ReactiveArray<TableColumn>;
  readonly rows: ReactiveArray<TableRow>;
  readonly numRows: Reactive<number>;

  static async create(
    editor: Editor,
    data: Omit<AppRouterInputs["tables"]["create"], "pageId">,
  ) {
    const properties = await client.tables.create.mutate({
      pageId: editor.pageId,
      ...data,
    });
    const table = new Table(editor, properties);
    editor.addTile(table, properties.sectionId, data.beforeId);
    editor.recordOperation({
      apply: { type: "tile.restore", data: { snapshots: [properties] } },
      reverse: { type: "tile.delete", data: { tileIds: [properties.id] } },
    });
  }

  constructor(editor: Editor, properties: ClientTableTile) {
    super(editor, properties);

    const { columns, rows, numRows } = properties;
    this.columns = array(columns);
    this.rows = array(rows);
    this.numRows = reactive(numRows);
  }

  // Columns

  async insertColumn(afterColumnId: string | null) {
    const afterIndex = this.columns.findIndex(
      (column) => column.id === afterColumnId,
    );
    const column = await client.tables.insertColumn.mutate({
      pageId: this.editor.pageId,
      tableId: this.id,
      afterColumnId,
    });
    this.columns.splice(afterIndex + 1, 0, column);

    this.editor.recordOperation({
      apply: {
        type: "table.insertColumn",
        data: { tableId: this.id, afterColumnId, column },
      },
      reverse: {
        type: "table.deleteColumn",
        data: { tableId: this.id, columnId: column.id },
      },
    });

    return column;
  }

  async moveColumn(id: string, afterId: string | null) {
    const columnIndex = this.columns.findIndex((c) => c.id === id);
    const previousAfterId = this.columns.value[columnIndex - 1]?.id ?? null;

    this.editor.recordOperation({
      apply: {
        type: "table.moveColumn",
        data: { tableId: this.id, columnId: id, afterColumnId: afterId },
      },
      reverse: {
        type: "table.moveColumn",
        data: {
          tableId: this.id,
          columnId: id,
          afterColumnId: previousAfterId,
        },
      },
    });

    return await client.tables.moveColumn.mutate({
      pageId: this.editor.pageId,
      tableId: this.id,
      columnId: id,
      afterColumnId: afterId,
    });
  }

  async updateColumn(
    id: string,
    properties: {
      title?: string | null;
      width?: number;
      background?: FillUpdate;
    },
  ) {
    const column = this.columns.find((c) => c.id === id);
    if (!column) {
      throw new Error(`Invalid column ID: ${id}`);
    }

    // Capture previous values for undoable properties
    const previousChanges: { title?: string | null; width?: number } = {};
    if (typeof properties.title !== "undefined") {
      previousChanges.title = column.title;
      column.title = properties.title;
    }
    if (typeof properties.width !== "undefined") {
      previousChanges.width = column.width;
      column.width = properties.width;
    }

    const result = await client.tables.updateColumn.mutate({
      pageId: this.editor.pageId,
      tableId: this.id,
      columnId: id,
      ...properties,
    });
    if (typeof properties.background !== "undefined") {
      column.background = result.background;
    }

    // Only record if there are undoable changes
    const changes: { title?: string | null; width?: number } = {};
    if (typeof properties.title !== "undefined") {
      changes.title = properties.title;
    }
    if (typeof properties.width !== "undefined") {
      changes.width = properties.width;
    }
    if (Object.keys(changes).length > 0) {
      this.editor.recordOperation({
        apply: {
          type: "table.setColumnProperties",
          data: { tableId: this.id, columnId: id, changes },
        },
        reverse: {
          type: "table.setColumnProperties",
          data: { tableId: this.id, columnId: id, changes: previousChanges },
        },
      });
    }

    return result;
  }

  removeColumns(ids: string[]) {
    if (ids.length === 0) {
      return;
    }

    // Capture columns with their positions for restoration
    const columnsWithPositions = ids.flatMap((id) => {
      const index = this.columns.findIndex((c) => c.id === id);
      const column = this.columns.value[index];
      if (!column) {
        return [];
      }
      const afterColumnId = this.columns.value[index - 1]?.id ?? null;
      return [{ column, afterColumnId }];
    });

    this.columns.value = this.columns.value.filter(
      (column) => !ids.includes(column.id),
    );

    // Record batch delete operation
    this.editor.recordOperation({
      apply: ids.map((columnId) => ({
        type: "table.deleteColumn" as const,
        data: { tableId: this.id, columnId },
      })),
      reverse: columnsWithPositions.map(({ column, afterColumnId }) => ({
        type: "table.restoreColumn" as const,
        data: { tableId: this.id, afterColumnId, column },
      })),
    });

    return client.tables.deleteColumns.mutate({
      pageId: this.editor.pageId,
      tableId: this.id,
      columnIds: ids,
    });
  }

  // Rows

  async insertRow(afterRowId: string | null) {
    const afterIndex = this.rows.findIndex((row) => row.id === afterRowId);
    const row = await client.tables.insertRow.mutate({
      pageId: this.editor.pageId,
      tableId: this.id,
      afterRowId,
    });
    this.rows.splice(afterIndex + 1, 0, row);
    this.numRows.value++;

    this.editor.recordOperation({
      apply: {
        type: "table.insertRow",
        data: { tableId: this.id, afterRowId, row },
      },
      reverse: {
        type: "table.deleteRow",
        data: { tableId: this.id, rowId: row.id },
      },
    });

    return row;
  }

  async appendRow() {
    const afterRowId = this.rows.value.at(-1)?.id ?? null;
    return this.insertRow(afterRowId);
  }

  async moveRow(id: string, afterId: string | null) {
    const rowIndex = this.rows.findIndex((r) => r.id === id);
    const previousAfterId = this.rows.value[rowIndex - 1]?.id ?? null;

    this.editor.recordOperation({
      apply: {
        type: "table.moveRow",
        data: { tableId: this.id, rowId: id, afterRowId: afterId },
      },
      reverse: {
        type: "table.moveRow",
        data: { tableId: this.id, rowId: id, afterRowId: previousAfterId },
      },
    });

    return await client.tables.moveRow.mutate({
      pageId: this.editor.pageId,
      tableId: this.id,
      rowId: id,
      afterRowId: afterId,
    });
  }

  setRowHeight(id: string, height: number) {
    const row = this.rows.find((r) => r.id === id);
    if (!row) {
      throw new Error(`Invalid row ID: ${id}`);
    }

    const previousHeight = row.height;
    row.height = height;

    this.editor.recordOperation({
      apply: {
        type: "table.setRowProperties",
        data: { tableId: this.id, rowId: id, changes: { height } },
      },
      reverse: {
        type: "table.setRowProperties",
        data: {
          tableId: this.id,
          rowId: id,
          changes: { height: previousHeight },
        },
      },
    });

    return client.tables.updateRow.mutate({
      pageId: this.editor.pageId,
      tableId: this.id,
      rowId: id,
      height,
    });
  }

  async setRowBackground(id: string, background: FillUpdate) {
    const row = this.rows.find((r) => r.id === id);
    if (!row) {
      throw new Error(`Invalid row ID: ${id}`);
    }
    const result = await client.tables.updateRow.mutate({
      pageId: this.editor.pageId,
      tableId: this.id,
      rowId: id,
      background,
    });
    row.background = result.background;
    return result.background;
  }

  removeRows(ids: string[]) {
    if (ids.length === 0) {
      return;
    }

    // Capture rows with their positions for restoration
    const rowsWithPositions = ids.flatMap((id) => {
      const index = this.rows.findIndex((r) => r.id === id);
      const row = this.rows.value[index];
      if (!row) {
        return [];
      }
      const afterRowId = this.rows.value[index - 1]?.id ?? null;
      return [{ row, afterRowId }];
    });

    this.rows.value = this.rows.value.filter((row) => !ids.includes(row.id));
    this.numRows.value = this.numRows.value - ids.length;

    // Record batch delete operation
    this.editor.recordOperation({
      apply: ids.map((rowId) => ({
        type: "table.deleteRow" as const,
        data: { tableId: this.id, rowId },
      })),
      reverse: rowsWithPositions.map(({ row, afterRowId }) => ({
        type: "table.restoreRow" as const,
        data: { tableId: this.id, afterRowId, row },
      })),
    });

    return client.tables.deleteRows.mutate({
      pageId: this.editor.pageId,
      tableId: this.id,
      rowIds: ids,
    });
  }

  // Cells

  async updateCell(
    data: Omit<AppRouterInputs["tables"]["updateCell"], "pageId" | "tableId">,
  ) {
    return await client.tables.updateCell.mutate({
      pageId: this.editor.pageId,
      tableId: this.id,
      ...data,
    });
  }

  async clearRanges(
    data: Omit<AppRouterInputs["tables"]["clearRanges"], "pageId" | "tableId">,
  ) {
    return await client.tables.clearRanges.mutate({
      pageId: this.editor.pageId,
      tableId: this.id,
      ...data,
    });
  }
}
