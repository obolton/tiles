import type { ClientTableTile } from "@/types/tiles";

/**
 * Format a table as markdown.
 */
export function toMarkdownTable(tile: ClientTableTile): string {
  const { columns, rows, numRows } = tile;

  if (columns.length === 0) {
    return "";
  }

  const headers = columns.map((c) => c.title ?? "");
  const lines = [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
  ];

  for (const row of rows) {
    const data = row.data as Record<string, unknown>;
    const cells = columns.map((col) => String(data[col.id] ?? ""));
    lines.push(`| ${cells.join(" | ")} |`);
  }

  if (numRows > rows.length) {
    lines.push(`(${numRows - rows.length} more rows)`);
  }

  return lines.join("\n");
}
