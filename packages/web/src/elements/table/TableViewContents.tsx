import Each from "@/jsx/each";
import { getBackgroundStyle } from "@/utils/backgrounds";
import type Table from "@/models/Table";
import type { JSX } from "@/jsx/jsx";

export interface TableViewContentsProps {
  table: Table;
  children: (
    value: PrismaJson.TableRowData[keyof PrismaJson.TableRowData] | undefined,
    { rowId, columnId }: { rowId: string; columnId: string },
  ) => JSX.Node;
}

export default function TableViewContents({
  table,
  children,
}: TableViewContentsProps) {
  return (
    <table>
      <colgroup>
        <col style={{ width: "32px" }} />

        <Each items={table.columns}>
          {(column, index) => (
            <col
              style={{
                width: column.width + "px",
                ...getBackgroundStyle(column.background),
              }}
              data-index={index}
              data-id={column.id}
            />
          )}
        </Each>
      </colgroup>

      <thead>
        <tr>
          <th scope="colgroup" />
          <Each items={table.columns}>
            {(column, index) => (
              <th scope="col" aria-colindex={index}>
                <span>{column.title}</span>
              </th>
            )}
          </Each>
        </tr>
      </thead>

      <tbody>
        <Each items={table.rows}>
          {(row, rowIndex) => (
            <tr
              style={{
                height: row.height + "px",
                ...getBackgroundStyle(row.background),
              }}
              aria-rowindex={rowIndex}
              data-id={row.id}
            >
              <th scope="row" />
              <Each items={table.columns}>
                {(column, columnIndex) => (
                  <td aria-colindex={columnIndex}>
                    {children(row.data[column.id], {
                      rowId: row.id,
                      columnId: column.id,
                    })}
                  </td>
                )}
              </Each>
            </tr>
          )}
        </Each>
      </tbody>
    </table>
  );
}
