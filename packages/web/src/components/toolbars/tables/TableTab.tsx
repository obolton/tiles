import TileTools from "@/components/toolbars/tiles/TileTools";
import type Table from "@/models/Table";

export interface TableTabProps {
  table: Table;
}

export default function TableTab({ table }: TableTabProps) {
  return (
    <toolbar-tab name="table" label="Table">
      <TileTools tile={table} />
    </toolbar-tab>
  );
}
