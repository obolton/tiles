import ToolbarButton from "@/components/buttons/ToolbarButton";
import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import FillPicker from "@/components/fills/FillPicker";
import AddColumnIcon from "@/icons/add-column.svg?jsx";
import ChartIcon from "@/icons/chart.svg?jsx";
import DeleteIcon from "@/icons/trash.svg?jsx";
import { handleError } from "@/utils/errors";
import Chart from "@/models/Chart";
import type TableView from "@/elements/table/TableView";
import type Table from "@/models/Table";
import type { FillUpdate } from "@/components/fills/types";

export interface ColumnTabProps {
  table: Table;
  getTable: () => TableView;
}

export default function ColumnTab({ table, getTable }: ColumnTabProps) {
  const { id, sectionId, page, columns } = table;

  function getSelectedColumn() {
    const selection = getTable().selection;
    if (!selection) {
      return null;
    }
    const first = Array.from(selection)[0];
    return first?.type === "column" ? first.column : null;
  }

  const background = columns.derive((cols) => {
    const column = getSelectedColumn();
    if (!column?.id) {
      return null;
    }
    return cols.find((c) => c.id === column.id)?.background ?? null;
  });

  async function setBackground(value: FillUpdate) {
    const column = getSelectedColumn();
    if (!column?.id) {
      return;
    }
    try {
      const result = await table.updateColumn(column.id, { background: value });
      getTable().setColumnBackground(column.id, result.background);
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
    await Chart.create(page, {
      sectionId,
      tableId: id,
      series: [{ columnId }],
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
      tableView.deleteColumns(columnIds);
      table.removeColumns(columnIds);
    }
  }

  return (
    <toolbar-tab name="column" label="Column">
      <ToolbarGroup label="Column tools">
        <FillPicker
          id={`${id}-column-background`}
          label="Background"
          value={background}
          onChange={setBackground}
        />
        <ToolbarButton label="Add column" on:click={addColumn}>
          <AddColumnIcon aria-hidden="true" />
          Add column
        </ToolbarButton>
        <ToolbarButton label="Create chart" on:click={createChart}>
          <ChartIcon aria-hidden="true" />
          Create chart
        </ToolbarButton>
        <ToolbarButton label="Delete" destructive on:click={deleteSelection}>
          <DeleteIcon aria-hidden="true" />
        </ToolbarButton>
      </ToolbarGroup>
    </toolbar-tab>
  );
}
