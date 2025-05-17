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
import { ReactiveValue } from "@/utils/reactivity";
import { serialize } from "@/utils/richText/serialize";
import { deserialize } from "@/utils/richText/deserialize";
import { render } from "@/jsx/dom";
import type { ClientTableTile } from "@/types/tiles";
import type TableView from "@/elements/table/TableView";
import type { Format } from "@/utils/richText/format";
import type { Command } from "prosemirror-state";
import type Editor from "@/editor/Editor";
import type { Reactive } from "@/utils/reactivity";

export interface TableTileProps extends ClientTableTile {
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

  const onFocusIn = (event: FocusEvent) => {
    if (!isEditable.value) {
      return;
    }

    const target = event.target;

    if (
      !(target instanceof HTMLElement) ||
      target.role !== "cell" ||
      !target.dataset.row ||
      !target.dataset.column ||
      editorView?.dom === target
    ) {
      return;
    }

    try {
      editorView?.destroy();

      const row = parseInt(target.dataset.row, 10);
      const column = parseInt(target.dataset.column, 10);

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

    if (
      !(target instanceof HTMLElement) ||
      target.role !== "cell" ||
      !target.dataset.row ||
      !target.dataset.column
    ) {
      return;
    }

    // Focus moved to a modal
    if (
      relatedTarget instanceof HTMLElement &&
      relatedTarget.closest("dialog[open]") !== null
    ) {
      return;
    }

    const row = parseInt(target.dataset.row, 10);
    const column = parseInt(target.dataset.column, 10);

    const rowData = data[row];
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

    rowData.data[column] = value;
    await editor.updateTableCell({
      tableId: id,
      rowId: rowData.id,
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

  const format = new ReactiveValue<Format>({
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
        onfocusin={onFocusIn}
        onfocusout={onFocusOut}
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
