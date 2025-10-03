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
import { moveElement } from "@/utils/arrays";
import { viewTransition } from "@/utils/transitions";
import TableViewContents from "@/elements/table/TableViewContents";
import type TableView from "@/elements/table/TableView";
import type { Format } from "@/utils/richText/format";
import type { Command } from "prosemirror-state";
import type Editor from "@/editor/Editor";
import type { Reactive } from "@/utils/reactivity";
import type { TableProperties } from "@/types/tiles";
import type { TableEvent } from "@/elements/table/events";
import type Column from "@/elements/table/Column";
import type Row from "@/elements/table/Row";
import type { Color } from "@/utils/color";
import type { RichText as RichTextType } from "@/utils/richText/types";

export interface TableTileProps extends TableProperties {
  editor: Editor;
  hasFocus: Reactive<boolean>;
  signal?: AbortSignal;
}

const KEY_MAP: Record<string, Command> = { Enter: () => true };

function createDocument(text: string): RichTextType {
  return [{ type: "paragraph", children: [{ type: "text", format: 0, text }] }];
}

export default function TableTile({
  editor,
  id,
  sectionId,
  textColor,
  background,
  columns,
  rows,
  numRows,
  hasFocus,
  signal,
}: TableTileProps) {
  let tableView: TableView | undefined;
  let editorView: EditorView | undefined;
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

  const updateCell = (row: Row, column: Column, cell: Element) => {
    if (!column.id) {
      return;
    }
    const value = rows.value[row.index]?.data[column.id];
    if (!value) {
      return;
    }
    if (typeof value === "string") {
      cell.textContent = value;
    } else {
      const contents = render(<RichText content={value} />);
      if (contents) {
        cell.replaceChildren(contents);
      }
    }
  };

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

  const onEditColumn = (event: TableEvent) => {
    const { column } = event;
    if (!column || !column.header) {
      return;
    }

    const input = document.createElement("input");
    input.type = "text";
    column.header.appendChild(input);
    input.focus();
  };

  const onEditColumnEnd = (event: TableEvent) => {
    const { column } = event;
    column?.header?.querySelector("input")?.remove();
  };

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
      columnInfo.width = width;
      await editor.updateTableColumn({
        tableId: id,
        columnId: column.id,
        width,
      });
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

  function onClearSelection() {
    const selection = tableView?.selection;
    if (!selection) {
      return;
    }

    const ranges = Array.from(
      selection.values().map((range) => {
        switch (range.type) {
          case "cells":
            return {
              type: "cells",
              from: {
                row: range.anchor.row.id!,
                column: range.anchor.column.id!,
              },
              to: {
                row: range.focus.row.id!,
                column: range.focus.column.id!,
              },
            } as const;

          case "columns":
            return {
              type: "columns",
              from: range.from.id!,
              to: range.to?.id ?? range.from.id!,
            } as const;

          case "rows":
            return {
              type: "rows",
              from: range.from.id!,
              to: range.to?.id ?? range.from.id!,
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
      const { textColor: newTextColor } = await editor.updateTable({
        id,
        textColor: value,
      });
      viewTransition(() => (textColor.value = newTextColor));
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

      {hasFocus.derive((value) =>
        value ? (
          <>
            <TableToolbar
              editor={editor}
              id={id}
              sectionId={sectionId}
              background={background}
              rows={rows}
              columns={columns}
              numRows={numRows}
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
          </>
        ) : null,
      )}
    </Tile>
  );
}
