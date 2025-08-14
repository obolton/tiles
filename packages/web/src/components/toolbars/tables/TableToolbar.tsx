import BackgroundPicker from "@/components/backgrounds/BackgroundPicker";
import AddRowIcon from "@/icons/add-row.svg?jsx";
import AddColumnIcon from "@/icons/add-column.svg?jsx";
import { handleError } from "@/utils/errors";
import { viewTransition } from "@/utils/transitions";
import type Editor from "@/editor/Editor";
import type { Background } from "@/components/backgrounds/types";
import type { TableProperties } from "@/types/tiles";
import type { Selection } from "@/elements/table/TableView";

export interface TableToolbarProps {
  editor: Editor;
  id: TableProperties["id"];
  background: TableProperties["background"];
  rows: TableProperties["rows"];
  columns: TableProperties["columns"];
  numRows: TableProperties["numRows"];
  getSelection: () => Set<Selection> | null;
  anchorName: string;
}

export default function TableToolbar({
  editor,
  id,
  background,
  rows,
  columns,
  numRows,
  getSelection,
  anchorName,
}: TableToolbarProps) {
  async function setBackground(value: Background) {
    try {
      const { background: newBackground } = await editor.updateTable({
        id,
        background: value,
      });
      viewTransition(() => (background.value = newBackground));
    } catch (error) {
      handleError(error);
    }
  }

  async function addRow() {
    const selection = getSelection();
    if (!selection) {
      return;
    }
    const first = Array.from(selection)[0];
    const index = first && "row" in first ? first.row : null;
    const afterRowId = index ? (rows.value[index]?.id ?? null) : null;
    await editor.insertTableRow({ tableId: id, afterRowId });
    numRows.value++;
  }

  async function addColumn() {
    const selection = getSelection();
    if (!selection) {
      return;
    }
    const first = Array.from(selection)[0];
    const index = first && "column" in first ? first.column : null;
    const afterColumnId = index ? (columns.value[index]?.id ?? null) : null;
    const column = await editor.insertTableColumn({
      tableId: id,
      afterColumnId,
    });
    columns.value = columns.value.concat(column);
  }

  return (
    <floating-toolbar
      className="vertical anchored"
      style={{ positionAnchor: anchorName }}
      data-tooltip-position="right"
      aria-label="Table tools"
    >
      <ul role="group">
        <li role="presentation">
          <button
            type="button"
            role="menuitem"
            className="floating"
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
            className="floating"
            aria-label="Add column"
            data-tooltip="Add column"
            onclick={addColumn}
          >
            <AddColumnIcon aria-hidden="true" />
          </button>
        </li>

        <li role="presentation">
          <BackgroundPicker value={background} onChange={setBackground} />
        </li>
      </ul>
    </floating-toolbar>
  );
}
