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
import type { Fill } from "@/components/fills/types";

export interface ColumnTabProps {
  table: Table;
  getTable: () => TableView;
}

export default function ColumnTab({ table, getTable }: ColumnTabProps) {
  const { id, columns } = table;

  function getSelectedColumn() {
    const selection = getTable().selection;
    const first = Array.from(selection)[0];
    return first?.type === "column" ? first.column : null;
  }

  const background = columns.derive((cols) => {
    const column = getSelectedColumn();
    if (!column?.id) {
      return null;
    }
    return cols.find((c) => c.id === column.id)?.background.value ?? null;
  });

  function setBackground(value: Fill | null) {
    const column = getSelectedColumn();
    if (!column?.id) {
      return;
    }
    try {
      table.columns.get(column.id).background.value = value;
      getTable().setColumnBackground(column.id, value);
    } catch (error) {
      handleError(error);
    }
  }

  async function addColumn() {
    const selection = getTable().selection;
    const first = Array.from(selection)[0];
    const column = first?.type === "column" ? first.column : null;
    const afterColumnId = column?.id ?? null;
    try {
      table.insertColumn(afterColumnId);
    } catch (error) {
      handleError(error);
    }
  }

  async function createChart() {
    const columnId = getSelectedColumn()?.id;
    const selected = columns.value.find((c) => c.id === columnId);
    if (!selected) {
      return;
    }
    try {
      await Chart.createFromTable(table, { columns: [selected] });
    } catch (error) {
      handleError(error);
    }
  }

  async function deleteSelection() {
    const tableView = getTable();
    const selectedColumns = tableView.selection
      .values()
      .filter((s) => s.type === "column")
      .map((s) => s.column)
      .toArray();
    if (selectedColumns.length > 0) {
      const columnIds = selectedColumns.map((column) => column.id!);
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
          aria-pressed={background}
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
