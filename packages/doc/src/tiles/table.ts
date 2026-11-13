import * as Y from "yjs";
import { generateNKeysBetween } from "jittered-fractional-indexing";
import { buildBaseTileMap, type CreateTileInput, type PlacementInput } from "./base";
import { createId } from "../id";
import type { Fill } from "../types/fill";

export const DEFAULT_COLUMN_WIDTH = 200;
export const DEFAULT_ROW_HEIGHT = 32;

export interface TableColumnInput {
  id?: string;
  title?: string | null;
  width?: number;
  background?: Fill | null;
}

export interface TableRowInput {
  height?: number;
  background?: Fill | null;
  cells?: readonly (string | null)[];
}

export interface TableMapInput extends Omit<CreateTileInput, "type"> {
  columns?: number | readonly TableColumnInput[];
  rows?: number | readonly TableRowInput[];
}

export function buildTableMap(
  properties: Omit<TableMapInput, keyof PlacementInput>,
): Y.Map<unknown> {
  const { columns = [], rows = [], ...baseProperties } = properties;
  const map = buildBaseTileMap({
    ...baseProperties,
    type: "TABLE",
    // Override default AUTO sizing
    sizing: baseProperties.sizing ?? "CUSTOM",
  });

  const columnInputs: readonly TableColumnInput[] =
    typeof columns === "number" ? Array.from({ length: columns }, () => ({})) : columns;
  const columnsMap = new Y.Map<Y.Map<unknown>>();
  const columnIds: string[] = [];
  const columnOrders = generateNKeysBetween(null, null, columnInputs.length);
  columnInputs.forEach((column, index) => {
    const id = column.id ?? createId();
    columnsMap.set(id, buildColumn(columnOrders[index]!, column));
    columnIds.push(id);
  });
  map.set("columns", columnsMap);

  const rowInputs: readonly TableRowInput[] =
    typeof rows === "number" ? Array.from({ length: rows }, () => ({})) : rows;
  const rowsMap = new Y.Map<Y.Map<unknown>>();
  const rowOrders = generateNKeysBetween(null, null, rowInputs.length);
  rowInputs.forEach((row, index) => {
    rowsMap.set(createId(), buildRow(rowOrders[index]!, row, columnIds));
  });
  map.set("rows", rowsMap);

  return map;
}

export function buildColumn(order: string, column: TableColumnInput = {}): Y.Map<unknown> {
  const map = new Y.Map<unknown>();
  map.set("order", order);
  map.set("title", column.title ?? null);
  map.set("width", column.width ?? DEFAULT_COLUMN_WIDTH);
  map.set("background", column.background ?? null);
  return map;
}

export function buildRow(
  order: string,
  row: TableRowInput = {},
  columnIds: readonly string[] = [],
): Y.Map<unknown> {
  const map = new Y.Map<unknown>();
  map.set("order", order);
  map.set("height", row.height ?? DEFAULT_ROW_HEIGHT);
  map.set("background", row.background ?? null);

  const cells = new Y.Map<unknown>();
  for (const [index, value] of (row.cells ?? []).entries()) {
    const columnId = columnIds[index];
    if (columnId && value) {
      cells.set(columnId, value);
    }
  }
  map.set("cells", cells);

  return map;
}

/** Deletes the given columns from a row's cells, or all cells when omitted. */
export function clearRowCells(row: Y.Map<unknown>, columnIds?: readonly string[]) {
  const cells = row.get("cells");
  if (!(cells instanceof Y.Map)) {
    return;
  }
  if (columnIds) {
    for (const columnId of columnIds) {
      cells.delete(columnId);
    }
  } else {
    cells.clear();
  }
}

export function getCell(row: Y.Map<unknown>, columnId: string): unknown {
  const cells = row.get("cells");
  return cells instanceof Y.Map ? (cells.get(columnId) ?? null) : null;
}

/**
 * The inclusive list of ids between two endpoints in an ordered list.
 */
export function idsInRange(ordered: string[], from: string, to: string): string[] {
  const i = ordered.indexOf(from);
  const j = ordered.indexOf(to);
  if (i === -1 || j === -1) {
    return [];
  }
  return i <= j ? ordered.slice(i, j + 1) : ordered.slice(j, i + 1);
}
