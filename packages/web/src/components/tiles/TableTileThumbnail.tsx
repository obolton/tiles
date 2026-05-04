import RichText from "@/components/text/RichText";
import Tile from "@/components/tiles/Tile";
import { combine } from "@/utils/reactivity";
import styles from "./TableTileThumbnail.module.css";
import type Table from "@/models/Table";

const PREVIEW_ROWS = 6;
const PREVIEW_COLUMNS = 5;

export interface TableTileThumbnailProps {
  table: Table;
}

export default function TableTileThumbnail({ table }: TableTileThumbnailProps) {
  const preview = combine(
    { columns: table.columns, rows: table.rows },
    ({ columns, rows }) => ({
      columns: columns.slice(0, PREVIEW_COLUMNS),
      rows: rows.slice(0, PREVIEW_ROWS),
    }),
  );

  return (
    <Tile>
      {preview.derive(({ columns, rows }) => (
        <table classList={{ "rich-text": true, [styles.table]: true }}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th>{column.title ?? ""}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr>
                {columns.map((column) => {
                  const value = row.data[column.id];
                  if (Array.isArray(value)) {
                    return (
                      <td>
                        <RichText content={value} />
                      </td>
                    );
                  }
                  return <td>{value ?? ""}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      ))}
    </Tile>
  );
}
