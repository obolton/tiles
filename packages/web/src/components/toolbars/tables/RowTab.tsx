import ToolbarButton from "@/components/buttons/ToolbarButton";
import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import FillPicker from "@/components/fills/FillPicker";
import AddRowIcon from "@/icons/add-row.svg?jsx";
import DeleteIcon from "@/icons/trash.svg?jsx";
import { handleError } from "@/utils/errors";
import type TableView from "@/elements/table/TableView";
import type Table from "@/models/Table";
import type { FillUpdate } from "@/components/fills/types";

export interface RowTabProps {
  table: Table;
  getTable: () => TableView;
}

export default function RowTab({ table, getTable }: RowTabProps) {
  const { id, rows } = table;

  function getSelectedRow() {
    const selection = getTable().selection;
    if (!selection) {
      return null;
    }
    const first = Array.from(selection)[0];
    return first?.type === "row" ? first.row : null;
  }

  const background = rows.derive((rowList) => {
    const row = getSelectedRow();
    if (!row?.id) {
      return null;
    }
    return rowList.find((r) => r.id === row.id)?.background ?? null;
  });

  async function setBackground(value: FillUpdate) {
    const row = getSelectedRow();
    if (!row?.id) {
      return;
    }
    try {
      const result = await table.setRowBackground(row.id, value);
      getTable().setRowBackground(row.id, result);
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

  async function deleteSelection() {
    const tableView = getTable();
    if (!tableView.selection) {
      return;
    }

    const selectedRows = tableView.selection
      .values()
      .filter((s) => s.type === "row")
      .map((s) => s.row)
      .toArray();
    if (selectedRows.length > 0) {
      const rowIds = selectedRows.map((row) => row.id!);
      tableView.deleteRows(rowIds);
      table.removeRows(rowIds);
    }
  }

  return (
    <toolbar-tab name="row" label="Row">
      <ToolbarGroup label="Row tools">
        <FillPicker
          id={`${id}-row-background`}
          label="Background"
          value={background}
          onChange={setBackground}
          aria-pressed={background}
        />
        <ToolbarButton label="Add row" on:click={addRow}>
          <AddRowIcon aria-hidden="true" />
          Add row
        </ToolbarButton>
        <ToolbarButton label="Delete" destructive on:click={deleteSelection}>
          <DeleteIcon aria-hidden="true" />
        </ToolbarButton>
      </ToolbarGroup>
    </toolbar-tab>
  );
}
