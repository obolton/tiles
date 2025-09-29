import type { TableProperties } from "@/types/tiles";
import type { JSX } from "@/jsx/jsx";

export interface TableViewContentsProps {
  rows: TableProperties["rows"];
  columns: TableProperties["columns"];
  children: (
    value: PrismaJson.TableRowData[keyof PrismaJson.TableRowData] | undefined,
    { rowId, columnId }: { rowId: string; columnId: string },
  ) => JSX.Node;
}

export default function TableViewContents({
  rows,
  columns,
  children,
}: TableViewContentsProps) {
  // On the client, allow the TableView element to control the table contents
  if (!import.meta.env.SSR) {
    return null;
  }

  return (
    <table>
      <colgroup>
        <col style={{ width: "32px" }} />

        {columns.value.map((column, index) => (
          <col
            style={{ width: column.width + "px" }}
            data-index={index}
            data-id={column.id}
          />
        ))}
      </colgroup>

      <thead>
        <tr>
          <th scope="colgroup" />
          {columns.value.map((_, index) => (
            <th scope="col" aria-colindex={index} />
          ))}
        </tr>
      </thead>

      <tbody>
        {rows.value.map((row, rowIndex) => {
          const cells = [];

          for (
            let columnIndex = 0;
            columnIndex < columns.value.length;
            columnIndex++
          ) {
            const column = columns.value[columnIndex]!;
            const value = row.data[column.id];
            cells.push(
              <td aria-colindex={columnIndex}>
                {children(value, { rowId: row.id, columnId: column.id })}
              </td>,
            );
          }

          return (
            <tr
              style={{ height: row.height + "px" }}
              aria-rowindex={rowIndex}
              data-id={row.id}
            >
              <th scope="row" />
              {cells}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
