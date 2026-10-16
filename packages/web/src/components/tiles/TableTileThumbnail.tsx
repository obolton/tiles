import RichText from "@/components/text/RichText";
import Tile from "@/components/tiles/Tile";
import TableViewContents from "@/elements/table/TableViewContents";
import styles from "./TableTileThumbnail.module.css";
import type Table from "@/models/Table";

export interface TableTileThumbnailProps {
  table: Table;
}

export default function TableTileThumbnail({ table }: TableTileThumbnailProps) {
  const isAuto = table.sizing.derive((sizing) => sizing === "AUTO");

  return (
    <Tile>
      <div classList={{ [styles.wrapper]: true, [styles.auto]: isAuto, "static-table-view": true }}>
        <TableViewContents table={table}>
          {(value) => (Array.isArray(value) ? <RichText content={value} /> : value)}
        </TableViewContents>
      </div>
    </Tile>
  );
}
