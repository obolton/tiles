import type { RichText } from "../richText";
import type { Fill } from "../fill";
import type { TileBase } from "./base";

export interface TableColumn {
  id: string;
  title: string | null;
  width: number;
  background: Fill | null;
}

export interface TableRow {
  id: string;
  height: number;
  data: { [columnId: string]: string | RichText | null };
  background: Fill | null;
}

export interface TableTile extends TileBase {
  type: "TABLE";
  columns: TableColumn[];
  rows: TableRow[];
}
