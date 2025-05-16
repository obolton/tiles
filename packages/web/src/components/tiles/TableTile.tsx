import Tile from "./Tile";
import RichText from "@/components/text/RichText";
import FormattingToolbar from "@/components/inputs/RichTextEditor/FormattingToolbar";
import { selectionFormat } from "@/utils/richText/format";
import styles from "./TableTile.module.css";
import { EditorView } from "prosemirror-view";
import { EditorState } from "prosemirror-state";
import { getPlugins } from "@/utils/richText/plugins";
import { schema } from "@/utils/richText/schema";
import { handleError } from "@/utils/errors";
import { Store } from "@/utils/stores";
import { serialize } from "@/utils/richText/serialize";
import { deserialize } from "@/utils/richText/deserialize";
import { render } from "@/jsx/dom";
import type { ClientTableTile } from "@/types/tiles";
import type TableView from "@/elements/table/TableView";
import type { TableCellEvent } from "@/elements/table/TableView";
import type { Format } from "@/utils/richText/format";
import type { Command } from "prosemirror-state";
import type Editor from "@/editor/Editor";
import type { StoreInterface } from "@/utils/stores";

export interface TableTileProps extends ClientTableTile {
  editor: Editor;
  hasFocus: StoreInterface<boolean>;
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
  numColumns,
  numRows,
  data,
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

  const updateCell = (row: number, column: number, cell: Element) => {
    const value = data[row]?.data[column];
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

  const onCellFocus = (event: TableCellEvent) => {
    const {
      cell: { row, column },
    } = event;

    if (!isEditable.value) {
      event.preventDefault();
      return;
    }

    try {
      editorView?.destroy();

      const value = data[row]?.data[column];
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
      event.cell.element.replaceChildren();
      editorView = new EditorView({ mount: event.cell.element }, { state });
    } catch (error) {
      handleError(error);
    }
  };

  const onCellBlur = async (event: TableCellEvent) => {
    const {
      cell: { row, column, element },
    } = event;

    if (!editorView) {
      return;
    }

    const rowId = data[row]?.id;
    if (!rowId) {
      return;
    }

    const value = serialize(editorView.state);
    editorView?.destroy();
    editorView = undefined;

    const contents = render(<RichText content={value} />);
    if (contents) {
      element.replaceChildren(contents);
    } else {
      element.replaceChildren();
    }

    await editor.updateTableCell({
      tableId: id,
      rowId,
      column,
      value,
    });
  };

  const getEditorState = () => editorView?.state;

  const performCommand = (command: Command) => {
    if (editorView) {
      command(editorView.state, editorView.dispatch, editorView);
    }
  };

  const format = new Store<Format>({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    highlight: false,
    h1: false,
    h2: false,
    h3: false,
    quote: false,
    orderedList: false,
    unorderedList: false,
    checkList: false,
    link: false,
  });

  return (
    <Tile>
      <table-view
        ref={ref}
        classList={["rich-text", styles.table]}
        columns={numColumns}
        rows={numRows}
        allowselection={isEditable}
        oncellfocus={onCellFocus}
        oncellblur={onCellBlur}
      >
        {data.map(({ data: rowData }, row) => {
          const cells = [];
          for (let col = 0; col < numColumns; col++) {
            const value = rowData[col];
            if (!value) {
              cells.push(
                <div
                  role="cell"
                  style={{ width: "160px" }}
                  data-row={row}
                  data-column={col}
                ></div>,
              );
            } else if (typeof value === "string") {
              cells.push(
                <div
                  role="cell"
                  style={{ width: "160px" }}
                  data-row={row}
                  data-column={col}
                >
                  {value}
                </div>,
              );
            } else {
              cells.push(
                <div
                  role="cell"
                  style={{ width: "160px" }}
                  data-row={row}
                  data-column={col}
                >
                  <RichText content={value} />
                </div>,
              );
            }
          }
          return <div role="row">{cells}</div>;
        })}
      </table-view>

      {hasFocus.derive((value) =>
        value ? (
          <FormattingToolbar
            format={format}
            getEditorState={getEditorState}
            performCommand={performCommand}
          />
        ) : null,
      )}
    </Tile>
  );
}
