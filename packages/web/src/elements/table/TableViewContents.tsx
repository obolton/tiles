import type Table from "@/items/Table";
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
  // On the client, allow the TableView element to control the table contents
  if (!import.meta.env.SSR) {
    return null;
  }

  return (
    <table>
      <colgroup>
        <col style={{ width: "32px" }} />

        {table.columns.value.map((column, index) => (
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
          {table.columns.value.map((column, index) => (
            <th scope="col" aria-colindex={index}>
              <span>{column.title}</span>
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {table.rows.value.map((row, rowIndex) => {
          const cells = [];

          for (
            let columnIndex = 0;
            columnIndex < table.columns.value.length;
            columnIndex++
          ) {
            const column = table.columns.value[columnIndex]!;
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
