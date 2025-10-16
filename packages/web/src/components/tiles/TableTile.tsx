import { keymap } from "prosemirror-keymap";
import Tile from "./Tile";
import RichText from "@/components/text/RichText";
import FormattingToolbar from "@/components/inputs/RichTextEditor/FormattingToolbar";
import TableToolbar from "@/components/toolbars/tables/TableToolbar";
import ColorPicker from "@/components/colors/ColorPicker";
import { getSelectionFormat, DEFAULT_FORMAT } from "@/utils/richText/format";
import { createState } from "@/utils/richText/state";
import { isPromptOpen } from "@/utils/richText/prompt";
import styles from "./TableTile.module.css";
import { EditorView } from "prosemirror-view";
import { handleError } from "@/utils/errors";
import { reactive, flag } from "@/utils/reactivity";
import { serialize } from "@/utils/richText/serialize";
import { render } from "@/jsx/dom";
import If from "@/jsx/if";
import { moveElement } from "@/utils/arrays";
import TableViewContents from "@/elements/table/TableViewContents";
import type TableView from "@/elements/table/TableView";
import type { Format } from "@/utils/richText/format";
import type { Command } from "prosemirror-state";
import type { Reactive } from "@/utils/reactivity";
import type { TableEvent } from "@/elements/table/events";
import type Column from "@/elements/table/Column";
import type Row from "@/elements/table/Row";
import type { Color } from "@/utils/color";
import type { RichText as RichTextType } from "@/utils/richText/types";
import type Table from "@/items/Table";

export interface TableTileProps {
  table: Table;
  hasFocus: Reactive<boolean>;
  signal?: AbortSignal;
}

const KEY_MAP: Record<string, Command> = { Enter: () => true };

function createDocument(text: string): RichTextType {
  return [{ type: "paragraph", children: [{ type: "text", format: 0, text }] }];
}

export default function TableTile({ table, hasFocus, signal }: TableTileProps) {
  let tableView: TableView | undefined;
  let editorView: EditorView | undefined;
  const { id, textColor, background, columns, rows, numRows, editor } = table;
  const { isEditable } = editor;

  const format = reactive<Format>(DEFAULT_FORMAT);
  const prompting = flag(false);

  signal?.addEventListener(
    "abort",
    () => requestAnimationFrame(() => editorView?.destroy()),
    { once: true },
  );

  function ref(element: TableView) {
    tableView = element;
  }

  function updateCell(row: Row, column: Column, cell: Element) {
    if (!column.id) {
      return;
    }
    const value = rows.value[row.index]?.data[column.id];
    if (!value) {
      return;
    } else if (typeof value === "string") {
      cell.textContent = value;
    } else {
      const contents = render(<RichText content={value} />);
      if (contents) {
        cell.replaceChildren(contents);
      }
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
      editorView?.destroy();

      const value = column.id ? rows.value[row.index]?.data[column.id] : null;
      const content =
        typeof value === "string" ? createDocument(value) : (value ?? null);
      const state = createState(content, [keymap(KEY_MAP)]);
      target.replaceChildren();

      const view = new EditorView(
        { mount: target },
        {
          state,
          dispatchTransaction(tr) {
            const newState = view.state.apply(tr);
            view.updateState(newState);
            format.value = getSelectionFormat(newState);
            prompting.value = isPromptOpen(newState);
          },
        },
      );
      view.focus();
      editorView = view;

      format.value = getSelectionFormat(state);
      prompting.value = isPromptOpen(state);
    } catch (error) {
      handleError(error);
    }
  };

  const onEditCellEnd = async (event: TableEvent) => {
    const { target, row, column } = event;

    if (
      !(target instanceof HTMLTableCellElement) ||
      !row ||
      !column ||
      !editorView
    ) {
      return;
    }

    const rowData = rows.value[row.index];
    const columnId = column.id;
    if (!rowData || !columnId) {
      return;
    }

    const value = serialize(editorView.state);
    editorView?.destroy();
    editorView = undefined;

    const contents = render(<RichText content={value} />);
    if (contents) {
      target.replaceChildren(contents);
    } else {
      target.replaceChildren();
    }

    rowData.data[columnId] = value;
    await editor.updateTableCell({
      tableId: id,
      rowId: rowData.id,
      columnId,
      value,
    });
  };

  function onEditColumn(event: TableEvent) {
    const { column } = event;
    if (!column || !column.header) {
      return;
    }

    const columnInfo = columns.value[column.index];
    if (!columnInfo) {
      return;
    }

    const input = document.createElement("input");
    input.type = "text";
    input.id = `${columnInfo.id}-title`;
    input.value = columnInfo.title ?? "";
    column.header.prepend(input);
    input.focus();
  }

  function onEditColumnEnd(event: TableEvent) {
    const { column } = event;
    const input = column?.header?.querySelector("input");

    if (!column?.id || !input) {
      return;
    }

    const columnInfo = columns.value[column.index];
    if (!columnInfo) {
      return;
    }

    const title = input.value;
    const span = column.header?.querySelector("span");
    if (span) {
      span.textContent = title;
    }
    table.setColumnTitle(column.id, title);
    input.remove();
  }

  const onResizeColumn = async (event: TableEvent) => {
    const { column, width } = event;
    if (!column || !column.id || !width) {
      return;
    }
    const columnInfo = columns.value[column.index];
    if (!columnInfo) {
      return;
    }
    try {
      await table.setColumnWidth(column.id, width);
    } catch (error) {
      handleError(error);
    }
  };

  const onMoveColumn = async (event: TableEvent) => {
    try {
      const { column, afterIndex } = event;
      if (
        !column ||
        typeof column.index !== "number" ||
        typeof afterIndex !== "number"
      ) {
        return;
      }
      const index = column.index;
      const columnId = column.id;
      if (!columnId) {
        throw new Error(`Invalid column index: ${column}`);
      }
      const afterColumnId = columns.value[afterIndex]?.id ?? null;
      columns.value = moveElement(columns.value, index, afterIndex + 1);
      await editor.moveTableColumn({
        tableId: id,
        columnId,
        afterColumnId,
      });
    } catch (error) {
      handleError(error);
    }
  };

  const onMoveRow = async (event: TableEvent) => {
    try {
      const { row, afterIndex } = event;
      if (!row || typeof afterIndex !== "number") {
        return;
      }
      const index = row.index;
      const rowId = row.id;
      if (!rowId) {
        throw new Error(`Invalid row index: ${index}`);
      }
      const afterRowId = rows.value[afterIndex]?.id ?? null;
      rows.value = moveElement(rows.value, index, afterIndex + 1);
      await editor.moveTableRow({
        tableId: id,
        rowId,
        afterRowId,
      });
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
    editor
      .clearTableRanges({
        tableId: id,
        ranges,
      })
      .catch(handleError);
  }

  const onChangeTextColor = async (value: Color | null) => {
    try {
      await table.setTextColor(value);
    } catch (error) {
      handleError(error);
    }
  };

  const getEditorView = () => editorView;

  function getTable() {
    if (!tableView) {
      throw new Error("Table is not initialized");
    }
    return tableView;
  }

  const performCommand = (command: Command) => {
    if (editorView) {
      command(editorView.state, editorView.dispatch, editorView);
    }
  };

  const anchorName = `--table-${id}`;

  return (
    <Tile textColor={textColor} background={background} anchorName={anchorName}>
      <table-view
        ref={ref}
        classList={["rich-text", styles.table]}
        columns={columns.derive((value) => value.length)}
        rows={numRows}
        editable={isEditable}
        on:edittablecellstart={onEditCell}
        on:edittablecellend={onEditCellEnd}
        on:edittablecolumnstart={onEditColumn}
        on:edittablecolumnend={onEditColumnEnd}
        on:resizetablecolumn={onResizeColumn}
        on:movetablecolumn={onMoveColumn}
        on:movetablerow={onMoveRow}
        on:appendtablerow={onAppendRow}
        on:cleartableselection={onClearSelection}
        $getColumn={(index) => columns.value[index]!}
        $getRow={(index) => rows.value[index]!}
        $updateCell={updateCell}
      >
        <TableViewContents rows={rows} columns={columns}>
          {(value) =>
            Array.isArray(value) ? <RichText content={value} /> : value
          }
        </TableViewContents>
      </table-view>

      <If condition={hasFocus}>
        <TableToolbar
          table={table}
          getTable={getTable}
          anchorName={anchorName}
        />

        <FormattingToolbar
          editor={editor}
          format={format}
          prompting={prompting}
          getEditorView={getEditorView}
          performCommand={performCommand}
        >
          <ul role="group">
            <li role="presentation">
              <ColorPicker
                id={`${id}-color-picker`}
                value={textColor}
                onChange={onChangeTextColor}
              />
            </li>
          </ul>
        </FormattingToolbar>
      </If>
    </Tile>
  );
}
