import BackgroundPicker from "@/components/backgrounds/BackgroundPicker";
import AddRowIcon from "@/icons/add-row.svg?jsx";
import AddColumnIcon from "@/icons/add-column.svg?jsx";
import ChartIcon from "@/icons/chart.svg?jsx";
import DeleteIcon from "@/icons/trash.svg?jsx";
import { handleError } from "@/utils/errors";
import { viewTransition } from "@/utils/transitions";
import type Editor from "@/editor/Editor";
import type { Background } from "@/components/backgrounds/types";
import type { TableProperties } from "@/types/tiles";
import type TableView from "@/elements/table/TableView";

export interface TableToolbarProps {
  editor: Editor;
  id: TableProperties["id"];
  sectionId: TableProperties["sectionId"];
  background: TableProperties["background"];
  rows: TableProperties["rows"];
  columns: TableProperties["columns"];
  numRows: TableProperties["numRows"];
  getTable: () => TableView;
  anchorName: string;
}

export default function TableToolbar({
  editor,
  id,
  sectionId,
  background,
  rows,
  columns,
  numRows,
  getTable,
  anchorName,
}: TableToolbarProps) {
  async function setBackground(value: Background | null) {
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
    const selection = getTable().selection;
    if (!selection) {
      return;
    }
    const first = Array.from(selection)[0];
    const row = first?.type === "rows" ? first.from : null;
    const afterRowId = row?.id ?? null;
    const newRow = await editor.insertTableRow({ tableId: id, afterRowId });
    rows.value = rows.value.concat(newRow);
    numRows.value++;
  }

  async function addColumn() {
    const selection = getTable().selection;
    if (!selection) {
      return;
    }
    const first = Array.from(selection)[0];
    const column = first?.type === "columns" ? first.from : null;
    const afterColumnId = column?.id ?? null;
    const newColumn = await editor.insertTableColumn({
      tableId: id,
      afterColumnId,
    });
    columns.value = columns.value.concat(newColumn);
  }

  async function createChart() {
    const selection = getTable().selection;
    if (!selection) {
      return;
    }
    const first = Array.from(selection)[0];
    const column = first?.type === "columns" ? first.from : null;
    const columnId = column?.id;
    if (!columnId) {
      return;
    }
    await editor.createChart({
      sectionId: sectionId.value,
      chartType: "BAR",
      series: [{ tableId: id, columnId }],
    });
  }

  async function deleteSelection() {
    const table = getTable();
    if (!table.selection) {
      return;
    }

    const selectedColumns = table.selection
      .values()
      .filter((s) => s.type === "columns")
      .map((s) => s.from)
      .toArray();
    if (selectedColumns.length > 0) {
      const columnIds = selectedColumns.map((column) => column.id!);
      for (const columnId of columnIds) {
        table.deleteColumn(columnId);
      }
      await editor.deleteTableColumns({
        tableId: id,
        columnIds,
      });
      columns.value = columns.value.filter((c) => !columnIds.includes(c.id));
    }

    const selectedRows = table.selection
      .values()
      .filter((s) => s.type === "rows")
      .map((s) => s.from)
      .toArray();
    if (selectedRows.length > 0) {
      const rowIds = selectedRows.map((row) => row.id!);
      for (const rowId of rowIds) {
        table.deleteRow(rowId);
      }
      await editor.deleteTableRows({
        tableId: id,
        rowIds,
      });
      rows.value = rows.value.filter((c) => !rowIds.includes(c.id));
    }
  }

  return (
    <floating-toolbar
      className="vertical anchored"
      style={{ positionAnchor: anchorName }}
      data-tooltip-position="left"
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
            on:click={addRow}
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
            on:click={addColumn}
          >
            <AddColumnIcon aria-hidden="true" />
          </button>
        </li>
        <li role="presentation">
          <button
            type="button"
            role="menuitem"
            className="floating"
            aria-label="Create chart"
            data-tooltip="Create chart"
            on:click={createChart}
          >
            <ChartIcon aria-hidden="true" />
          </button>
        </li>
        <li role="presentation">
          <BackgroundPicker
            id={`${id}-background`}
            workspaceId={editor.workspaceId}
            value={background}
            onChange={setBackground}
          />
        </li>
        <li role="presentation">
          <button
            type="button"
            role="menuitem"
            className="floating destructive"
            aria-label="Delete"
            data-tooltip="Delete"
            on:click={deleteSelection}
          >
            <DeleteIcon aria-hidden="true" />
          </button>
        </li>
      </ul>
    </floating-toolbar>
  );
}
