import ToolbarButton from "@/components/buttons/ToolbarButton";
import AddRowIcon from "@/icons/add-row.svg?jsx";
import DeleteIcon from "@/icons/trash.svg?jsx";
import { handleError } from "@/utils/errors";
import type TableView from "@/elements/table/TableView";
import type Table from "@/models/Table";

export interface RowToolbarProps {
  table: Table;
  getTable: () => TableView;
}

export default function RowToolbar({ table, getTable }: RowToolbarProps) {
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
      for (const rowId of rowIds) {
        tableView.deleteRow(rowId);
      }
      table.removeRows(rowIds);
    }
  }

  return (
    <floating-toolbar
      className="primary"
      data-tooltip-position="top"
      aria-label="Row tools"
    >
      <ul role="group">
        <li role="presentation">
          <ToolbarButton label="Add row" on:click={addRow}>
            <AddRowIcon aria-hidden="true" />
            Add row
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
