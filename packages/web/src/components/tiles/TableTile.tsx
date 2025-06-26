import Tile from "./Tile";
import RichText from "@/components/text/RichText";
import FormattingToolbar from "@/components/inputs/RichTextEditor/FormattingToolbar";
import AddRowIcon from "@/icons/add-row.svg?jsx";
import AddColumnIcon from "@/icons/add-column.svg?jsx";
import { selectionFormat } from "@/utils/richText/format";
import styles from "./TableTile.module.css";
import { EditorView } from "prosemirror-view";
import { EditorState } from "prosemirror-state";
import { getPlugins } from "@/utils/richText/plugins";
import { schema } from "@/utils/richText/schema";
import { handleError } from "@/utils/errors";
import { ReactiveValue } from "@/utils/reactivity";
import { serialize } from "@/utils/richText/serialize";
import { deserialize } from "@/utils/richText/deserialize";
import { render } from "@/jsx/dom";
import type TableView from "@/elements/table/TableView";
import type { Format } from "@/utils/richText/format";
import type { Command } from "prosemirror-state";
import type Editor from "@/editor/Editor";
import type { Reactive } from "@/utils/reactivity";
import type { TableProperties } from "@/types/tiles";
import type { TableEvent } from "@/elements/table/events";

export interface TableTileProps extends TableProperties {
  editor: Editor;
  hasFocus: Reactive<boolean>;
  signal?: AbortSignal;
}

function createDocument(value: string) {
  return schema.nodes.doc.create(
    null,
    schema.nodes.paragraph.create(null, value ? schema.text(value) : null),
  );
}

export default function TableTile({
  editor,
  id,
  columns,
  rows,
  numRows,
  hasFocus,
  signal,
}: TableTileProps) {
  let editorView: EditorView | undefined;
  const { isEditable } = editor;

  signal?.addEventListener(
    "abort",
    () => requestAnimationFrame(() => editorView?.destroy()),
    { once: true },
  );

  function ref(element: TableView) {
    element.enableVirtualization(updateCell);
  }

  const addRow = async () => {
    await editor.appendTableRow({ tableId: id });
    numRows.value++;
  };

  const addColumn = async () => {
    const column = await editor.appendTableColumn({ tableId: id });
    columns.value = columns.value.concat(column);
  };

  const updateCell = (row: number, column: number, cell: Element) => {
    const columnId = columns.value[column]?.id;
    if (!columnId) {
      return;
    }
    const value = rows.value[row]?.data[columnId];
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

  const onFocusIn = (event: FocusEvent) => {
    if (!isEditable.value) {
      return;
    }

    const target = event.target;

    if (
      !(target instanceof HTMLTableCellElement) ||
      editorView?.dom === target
    ) {
      return;
    }

    const rowElement = target.parentElement as HTMLTableRowElement;

    if (!rowElement.ariaRowIndex || !target.ariaColIndex) {
      return;
    }

    try {
      editorView?.destroy();

      const row = parseInt(rowElement.ariaRowIndex, 10);
      const column = parseInt(target.ariaColIndex, 10);
      const columnId = columns.value[column]?.id;

      const value = columnId ? rows.value[row]?.data[columnId] : null;
      const doc = !value
        ? createDocument("")
        : typeof value === "string"
          ? createDocument(value)
          : deserialize(value);

      const plugins = getPlugins().concat(
        selectionFormat((newFormat) => {
          format.value = newFormat;
        }),
      );
      const state = EditorState.create({
        doc,
        plugins,
      });
      target.replaceChildren();
      editorView = new EditorView({ mount: target }, { state });
    } catch (error) {
      handleError(error);
    }
  };

  const onFocusOut = async (event: FocusEvent) => {
    if (!editorView) {
      return;
    }

    const { target, relatedTarget } = event;

    if (!(target instanceof HTMLTableCellElement)) {
      return;
    }

    const rowElement = target.parentElement as HTMLTableRowElement;

    if (!rowElement.ariaRowIndex || !target.ariaColIndex) {
      return;
    }

    // Focus moved to a modal
    if (
      relatedTarget instanceof HTMLElement &&
      relatedTarget.closest("dialog[open]") !== null
    ) {
      return;
    }

    const row = parseInt(rowElement.ariaRowIndex, 10);
    const column = parseInt(target.ariaColIndex, 10);
    const columnId = columns.value[column]?.id;

    if (!columnId) {
      return;
    }

    const rowData = rows.value[row];
    if (!rowData) {
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

  const onResizeColumn = async (event: TableEvent) => {
    const { column, width } = event;
    if (typeof column !== "number" || typeof width !== "number") {
      return;
    }
    const columnInfo = columns.value[column];
    if (!columnInfo) {
      return;
    }
    try {
      columnInfo.width = width;
      await editor.updateTableColumn({
        tableId: id,
        columnId: columnInfo.id,
        width,
      });
    } catch (error) {
      handleError(error);
    }
  };

  const getEditorView = () => editorView;

  const performCommand = (command: Command) => {
    if (editorView) {
      command(editorView.state, editorView.dispatch, editorView);
    }
  };

  const format = new ReactiveValue<Format>({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    highlight: false,
    headingLevel: null,
    quote: false,
    list: null,
    link: false,
  });

  return (
    <Tile>
      <table-view
        ref={ref}
        classList={["rich-text", styles.table]}
        columns={columns.derive((value) => value.length)}
        rows={numRows}
        allowselection={isEditable}
        on:focusin={onFocusIn}
        on:focusout={onFocusOut}
        on:resizetablecolumn={onResizeColumn}
        $getColumnWidth={(index) => columns.value[index]?.width ?? 200}
      >
        <table>
          <colgroup>
            <col style={{ width: "32px" }} />
            {columns.value.map((column, index) => (
              <col data-index={index} style={{ width: column.width + "px" }} />
            ))}
          </colgroup>

          <thead>
            <tr>
              <th scope="colgroup" />
              {columns.value.map((_, index) => (
                <th scope="col" aria-colindex={index} />
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.value.map(({ data: rowData }, row) => {
              const cells = [];
              for (
                let columnIndex = 0;
                columnIndex < columns.value.length;
                columnIndex++
              ) {
                const column = columns.value[columnIndex]!;
                const value = rowData[column.id];
                if (!value) {
                  cells.push(<td aria-colindex={columnIndex}></td>);
                } else if (typeof value === "string") {
                  cells.push(<td aria-colindex={columnIndex}>{value}</td>);
                } else {
                  cells.push(
                    <td aria-colindex={columnIndex}>
                      <RichText content={value} />
                    </td>,
                  );
                }
              }
              return (
                <tr aria-rowindex={row}>
                  <th scope="row" />
                  {cells}
                </tr>
              );
            })}
          </tbody>
        </table>
      </table-view>

      {hasFocus.derive((value) =>
        value ? (
          <FormattingToolbar
            editor={editor}
            format={format}
            getEditorView={getEditorView}
            performCommand={performCommand}
          >
            <ul role="group">
              <li role="presentation">
                <button
                  type="button"
                  role="menuitem"
                  className="floating small"
                  aria-label="Add row"
                  data-tooltip="Add row"
                  onclick={addRow}
                >
                  <AddRowIcon aria-hidden="true" />
                </button>
              </li>
              <li role="presentation">
                <button
                  type="button"
                  role="menuitem"
                  className="floating small"
                  aria-label="Add column"
                  data-tooltip="Add column"
                  onclick={addColumn}
                >
                  <AddColumnIcon aria-hidden="true" />
                </button>
              </li>
            </ul>
          </FormattingToolbar>
        ) : null,
      )}
    </Tile>
  );
}
