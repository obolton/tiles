import TileTools from "@/components/toolbars/tiles/TileTools";
import ColorPicker from "@/components/colors/ColorPicker";
import BackgroundPicker from "@/components/backgrounds/BackgroundPicker";
import ToolbarButton from "@/components/buttons/ToolbarButton";
import AddRowIcon from "@/icons/add-row.svg?jsx";
import AddColumnIcon from "@/icons/add-column.svg?jsx";
import ChartIcon from "@/icons/chart.svg?jsx";
import DeleteIcon from "@/icons/trash.svg?jsx";
import { handleError } from "@/utils/errors";
import Chart from "@/models/Chart";
import type { Color } from "@/utils/color";
import type { BackgroundUpdate } from "@/components/backgrounds/types";
import type TableView from "@/elements/table/TableView";
import type Table from "@/models/Table";

export interface TableToolbarProps {
  table: Table;
  getTable: () => TableView;
  anchorName: string;
}

export default function TableToolbar({
  table,
  getTable,
  anchorName,
}: TableToolbarProps) {
  const { id, sectionId, textColor, background, editor } = table;

  async function setTextColor(value: Color | null) {
    try {
      await table.setTextColor(value);
    } catch (error) {
      handleError(error);
    }
  }

  async function setBackground(value: BackgroundUpdate) {
    try {
      await table.setBackground(value);
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
    const row = first?.type === "row" ? first.row : null;
    const afterRowId = row?.id ?? null;
    try {
      await table.insertRow(afterRowId);
    } catch (error) {
      handleError(error);
    }
  }

  async function addColumn() {
    const selection = getTable().selection;
    if (!selection) {
      return;
    }
    const first = Array.from(selection)[0];
    const column = first?.type === "column" ? first.column : null;
    const afterColumnId = column?.id ?? null;
    try {
      await table.insertColumn(afterColumnId);
    } catch (error) {
      handleError(error);
    }
  }

  async function createChart() {
    const selection = getTable().selection;
    if (!selection) {
      return;
    }
    const first = Array.from(selection)[0];
    const column = first?.type === "column" ? first.column : null;
    const columnId = column?.id;
    if (!columnId) {
      return;
    }
    await Chart.create(editor, {
      sectionId: sectionId.value,
      tableId: id,
      series: [columnId],
    });
  }

  async function deleteSelection() {
    const tableView = getTable();
    if (!tableView.selection) {
      return;
    }

    const selectedColumns = tableView.selection
      .values()
      .filter((s) => s.type === "column")
      .map((s) => s.column)
      .toArray();
    if (selectedColumns.length > 0) {
      const columnIds = selectedColumns.map((column) => column.id!);
      for (const columnId of columnIds) {
        tableView.deleteColumn(columnId);
      }
      table.removeColumns(columnIds);
    }

    const selectedRows = tableView.selection
      .values()
      .filter((s) => s.type === "row")
      .map((s) => s.row)
      .toArray();
    if (selectedRows.length > 0) {
      const rowIds = selectedRows.map((row) => row.id!);
      for (const rowId of rowIds) {
        tableView.deleteRow(rowId);
      }
      table.removeRows(rowIds);
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
          <ColorPicker
            id={`${id}-color-picker`}
            value={textColor}
            onChange={setTextColor}
          />
        </li>
      </ul>

      <ul role="group">
        <li role="presentation">
          <ToolbarButton label="Add row" on:click={addRow}>
            <AddRowIcon aria-hidden="true" />
          </ToolbarButton>
        </li>
        <li role="presentation">
          <ToolbarButton label="Add column" on:click={addColumn}>
            <AddColumnIcon aria-hidden="true" />
          </ToolbarButton>
        </li>
        <li role="presentation">
          <ToolbarButton label="Create chart" on:click={createChart}>
            <ChartIcon aria-hidden="true" />
          </ToolbarButton>
        </li>
        <li role="presentation">
          <BackgroundPicker
            id={`${id}-background`}
            value={background}
            onChange={setBackground}
          />
        </li>
        <li role="presentation">
          <ToolbarButton label="Delete" destructive on:click={deleteSelection}>
            <DeleteIcon aria-hidden="true" />
          </ToolbarButton>
        </li>
      </ul>

      <TileTools tile={table} />
    </floating-toolbar>
  );
}
