import { keymap } from "prosemirror-keymap";
import Tile from "./Tile";
import RichText from "@/components/text/RichText";
import TableToolbar from "@/components/toolbars/tables/TableToolbar";
import { createState } from "@/utils/richText/state";
import styles from "./TableTile.module.css";
import { EditorView } from "prosemirror-view";
import { handleError } from "@/utils/errors";
import { reactive } from "reactivity";
import { serialize } from "@/utils/richText/serialize";
import { render } from "@/jsx/dom";
import If from "@/jsx/if";
import Portal from "@/jsx/portal";
import TableViewContents from "@/elements/table/TableViewContents";
import type TableView from "@/elements/table/TableView";
import type { Command } from "prosemirror-state";
import type { Reactive } from "reactivity";
import type { TableEvent } from "@/elements/table/events";
import type Column from "@/elements/table/Column";
import type Row from "@/elements/table/Row";
import type { RichText as RichTextType } from "@/utils/richText/types";
import type Table from "@/models/Table";
import type { EditorState } from "prosemirror-state";

export interface TableTileProps {
  table: Table;
  showToolbar: Reactive<boolean>;
  signal?: AbortSignal;
}

const KEY_MAP: Record<string, Command> = { Enter: () => true };

function createDocument(text: string): RichTextType {
  return [{ type: "paragraph", children: [{ type: "text", format: 0, text }] }];
}

export default function TableTile({ table, showToolbar, signal }: TableTileProps) {
  let tableView: TableView | undefined;
  const editorView: Reactive<EditorView | null> = reactive(null);
  const state: Reactive<EditorState | null> = reactive(null);
  const { columns, rows, editor } = table;
  const { isEditable } = editor;
  const selectionType = reactive<"row" | "column" | "range" | null>(null);

  signal?.addEventListener(
    "abort",
    () =>
      requestAnimationFrame(() => {
        editorView.value?.destroy();
        editorView.value = null;
      }),
    { once: true },
  );

  function ref(element: TableView) {
    tableView = element;
  }

  function updateCell(row: Row, column: Column, cell: Element) {
    if (!column.id) {
      return;
    }
    const value = rows.value[row.index]?.cell(column.id);
    if (!value) {
      return;
    } else if (typeof value === "string") {
      cell.textContent = value;
    } else {
      const contents = render(<RichText content={value} />);
      cell.replaceChildren(...contents);
    }
  }

  const onEditCell = (event: TableEvent) => {
    if (!isEditable.value) {
      return;
    }

    const { target, row, column } = event;
    if (!(target instanceof HTMLTableCellElement) || !row || !column) {
      return;
    }

    try {
      editorView.value?.destroy();

      const value = column.id ? rows.value[row.index]?.cell(column.id) : null;
      const content = typeof value === "string" ? createDocument(value) : (value ?? null);
      state.value = createState(content, [keymap(KEY_MAP)]);
      target.replaceChildren();

      const view = new EditorView(
        { mount: target },
        {
          state: state.value,
          dispatchTransaction(tr) {
            const newState = view.state.apply(tr);
            view.updateState(newState);
            state.value = newState;
          },
        },
      );
      view.focus();
      editorView.value = view;
    } catch (error) {
      handleError(error);
    }
  };

  const onEditCellEnd = async (event: TableEvent) => {
    const { target, row, column } = event;

    if (!(target instanceof HTMLTableCellElement) || !row || !column || !state.value) {
      return;
    }

    const rowData = rows.value[row.index];
    const columnId = column.id;
    if (!rowData || !columnId) {
      return;
    }

    const value = serialize(state.value);
    editorView.value?.destroy();
    editorView.value = null;

    const contents = render(<RichText content={value} />);
    target.replaceChildren(...contents);

    table.updateCell({ rowId: rowData.id, columnId, value });
  };

  const onUpdateColumn = (event: TableEvent) => {
    const { column, width, title } = event;
    if (!column?.id) {
      return;
    }
    try {
      const model = table.columns.get(column.id);
      if (width !== undefined) {
        model.width.value = width;
      }
      if (title !== undefined) {
        model.title.value = title;
      }
    } catch (error) {
      handleError(error);
    }
  };

  const onResizeRow = (event: TableEvent) => {
    const { row, height } = event;
    if (!row?.id || !height) {
      return;
    }
    try {
      table.rows.get(row.id).height.value = height;
    } catch (error) {
      handleError(error);
    }
  };

  const onMoveColumn = (event: TableEvent) => {
    const { column, afterId } = event;
    if (!column?.id) {
      return;
    }
    try {
      table.moveColumn(column.id, afterId ?? null);
    } catch (error) {
      handleError(error);
    }
  };

  const onMoveRow = (event: TableEvent) => {
    const { row, afterId } = event;
    if (!row?.id) {
      return;
    }
    try {
      table.moveRow(row.id, afterId ?? null);
    } catch (error) {
      handleError(error);
    }
  };

  async function onAppendRow() {
    return table.appendRow();
  }

  function onClearSelection() {
    const selection = tableView?.selection;
    if (!selection) {
      return;
    }

    const ranges = Array.from(
      selection.values().map((selection) => {
        switch (selection.type) {
          case "range":
            return {
              type: "cells",
              from: {
                row: selection.anchor.row.id!,
                column: selection.anchor.column.id!,
              },
              to: {
                row: selection.focus.row.id!,
                column: selection.focus.column.id!,
              },
            } as const;

          case "column":
            return {
              type: "columns",
              from: selection.column.id!,
              to: selection.column.id!,
            } as const;

          case "row":
            return {
              type: "rows",
              from: selection.row.id!,
              to: selection.row.id!,
            } as const;
        }
      }),
    );
    try {
      table.clearRanges({ ranges });
    } catch (error) {
      handleError(error);
    }
  }

  function onSelectionChange() {
    const selection = tableView?.selection;
    if (!selection) {
      selectionType.value = null;
      return;
    }
    const [item] = Array.from(selection);
    selectionType.value = item?.type ?? null;
  }

  function getTable() {
    if (!tableView) {
      throw new Error("Table is not initialized");
    }
    return tableView;
  }

  return (
    <Tile>
      <table-view
        ref={ref}
        classList={{ "rich-text": true, [styles.table]: true }}
        $columns={columns}
        $rows={rows}
        editable={isEditable}
        on:edittablecellstart={onEditCell}
        on:edittablecellend={onEditCellEnd}
        on:updatetablecolumn={onUpdateColumn}
        on:resizetablerow={onResizeRow}
        on:movetablecolumn={onMoveColumn}
        on:movetablerow={onMoveRow}
        on:appendtablerow={onAppendRow}
        on:cleartableselection={onClearSelection}
        on:tableselectionchange={onSelectionChange}
        $updateCell={updateCell}
      >
        {import.meta.env.SSR && (
          <TableViewContents table={table}>
            {(value) => (Array.isArray(value) ? <RichText content={value} /> : value)}
          </TableViewContents>
        )}
      </table-view>

      <If condition={showToolbar}>
        <Portal element="toolbar-slot">
          <TableToolbar
            table={table}
            getTable={getTable}
            selectionType={selectionType}
            editorView={editorView}
            state={state}
          />
        </Portal>
      </If>
    </Tile>
  );
}
