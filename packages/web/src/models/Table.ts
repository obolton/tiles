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
import type { Color } from "@/utils/color";
import type { BackgroundUpdate } from "@/components/backgrounds/types";
import type { RichText } from "@/utils/richText/types";
import type { AppRouterInputs } from "@/api/client";

export interface TableColumn {
  id: string;
  width: number;
  title: string | null;
}

export interface TableRow {
  id: string;
  height: number;
  data: Record<string, RichText | string | null>;
}

export default class Table extends Tile {
  readonly type = "TABLE";

  readonly textColor: Reactive<Color | null>;
  readonly background: Reactive<ClientTableTile["background"]>;
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
    editor.addTile(properties);
  }

  constructor(editor: Editor, properties: ClientTableTile) {
    super(editor, properties);

    const { textColor, background, columns, rows, numRows } = properties;
    this.textColor = reactive(textColor);
    this.background = reactive(background);
    this.columns = array(columns);
    this.rows = array(rows);
    this.numRows = reactive(numRows);
  }

  private update(
    properties: Omit<AppRouterInputs["tables"]["update"], "pageId" | "id">,
  ) {
    return client.tables.update.mutate({
      ...properties,
      pageId: this.editor.pageId,
      id: this.id,
    });
  }

  setTextColor(textColor: Color | null) {
    this.textColor.value = textColor;
    this.update({ textColor });
  }

  async setBackground(background: BackgroundUpdate) {
    const result = await this.update({ background });
    this.background.value = result.background;
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

  private updateColumn(
    properties: Omit<
      AppRouterInputs["tables"]["updateColumn"],
      "pageId" | "tableId"
    >,
  ) {
    return client.tables.updateColumn.mutate({
      ...properties,
      pageId: this.editor.pageId,
      tableId: this.id,
    });
  }

  setColumnTitle(id: string, title: string | null) {
    const column = this.columns.find((c) => c.id === id);
    if (!column) {
      throw new Error(`Invalid column ID: ${id}`);
    }
    column.title = title;
    return this.updateColumn({
      columnId: id,
      title,
    });
  }

  setColumnWidth(id: string, width: number) {
    const column = this.columns.find((c) => c.id === id);
    if (!column) {
      throw new Error(`Invalid column ID: ${id}`);
    }
    column.width = width;
    return this.updateColumn({
      columnId: id,
      width,
    });
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
}
