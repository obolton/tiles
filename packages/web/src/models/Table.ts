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
    return column;
  }

  async moveColumn(id: string, afterId: string | null) {
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
    if (typeof properties.title !== "undefined") {
      column.title = properties.title;
    }
    if (typeof properties.width !== "undefined") {
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
    return result;
  }

  removeColumns(ids: string[]) {
    if (ids.length === 0) {
      return;
    }
    this.columns.value = this.columns.value.filter(
      (column) => !ids.includes(column.id),
    );
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
    return row;
  }

  async appendRow() {
    const afterRowId = this.rows.value.at(-1)?.id ?? null;
    return this.insertRow(afterRowId);
  }

  async moveRow(id: string, afterId: string | null) {
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
    row.height = height;
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
    this.rows.value = this.rows.value.filter((row) => !ids.includes(row.id));
    this.numRows.value = this.numRows.value - ids.length;
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
