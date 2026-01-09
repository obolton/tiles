import TileTools from "@/components/toolbars/tiles/TileTools";
import StyleTools from "@/components/toolbars/tiles/StyleTools";
import type Table from "@/models/Table";

export interface TableTabProps {
  table: Table;
}

export default function TableTab({ table }: TableTabProps) {
  return (
    <toolbar-tab name="table" label="Table">
      <StyleTools tile={table} />
      <TileTools tile={table} />
    </toolbar-tab>
  );
}
