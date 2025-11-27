import ToolbarButton from "@/components/buttons/ToolbarButton";
import AddColumnIcon from "@/icons/add-column.svg?jsx";
import ChartIcon from "@/icons/chart.svg?jsx";
import DeleteIcon from "@/icons/trash.svg?jsx";
import { handleError } from "@/utils/errors";
import Chart from "@/models/Chart";
import type TableView from "@/elements/table/TableView";
import type Table from "@/models/Table";

export interface ColumnToolbarProps {
  table: Table;
  getTable: () => TableView;
}

export default function ColumnToolbar({
  table,
  getTable,
}: ColumnToolbarProps) {
  const { id, sectionId, editor } = table;

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
      sectionId,
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
  }

  return (
    <floating-toolbar
      className="primary"
      data-tooltip-position="top"
      aria-label="Column tools"
    >
      <ul role="group">
        <li role="presentation">
          <ToolbarButton label="Add column" on:click={addColumn}>
            <AddColumnIcon aria-hidden="true" />
            Add column
          </ToolbarButton>
        </li>
        <li role="presentation">
          <ToolbarButton label="Create chart" on:click={createChart}>
            <ChartIcon aria-hidden="true" />
            Create chart
          </ToolbarButton>
        </li>
        <li role="presentation">
          <ToolbarButton label="Delete" destructive on:click={deleteSelection}>
            <DeleteIcon aria-hidden="true" />
          </ToolbarButton>
        </li>
      </ul>
    </floating-toolbar>
  );
}
