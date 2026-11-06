import * as Y from "yjs";
import { BODY_ID } from "doc/body";
import { getChildren, orderedEntries } from "doc/placement/ordering";
import { getCell } from "doc/tiles/table";
import { fragmentToMarkdown } from "doc/richText/markdown";
import { getTileIds } from "doc/richText/tiles";
import { toMarkdown } from "@/ai/context/markdown";
import type { RichText } from "doc/types/richText";
import type { TileType } from "doc/types/enums";

export interface TileContent {
  id: string;
  type: TileType;
  content: string;
}

type TileSerializer = (tile: Y.Map<unknown>) => string;

const TILE_CONTENT: Partial<Record<TileType, TileSerializer>> = {
  TEXT: getTextContent,
  IMAGE: getImageContent,
  VIDEO: getVideoContent,
  LINK: getLinkContent,
  PAGE_LINK: getPageLinkContent,
  TABLE: getTableContent,
  CHART: getChartContent,
};

/**
 * Resolves tile IDs to their content from a Y.Doc. Sections expand to their children and
 * {@link BODY_ID} to the document body, whose embedded tiles are inlined with their own IDs.
 */
export function resolveTileContents(
  doc: Y.Doc,
  ids: string[],
  body: Y.XmlFragment | null = null,
): TileContent[] {
  const tiles = doc.getMap<Y.Map<unknown>>("tiles");
  const resolved = expandReferences(tiles, ids, body);

  const describe = (id: string): string => {
    const tile = tiles.get(id);
    if (!tile) {
      return "";
    }
    if (tile.get("type") === "SECTION") {
      return getChildren(tiles, id)
        .map((child) => describe(child.id))
        .filter((content) => content.length > 0)
        .join("\n\n");
    }
    const content = getTileContent(tile);
    const header = `[${resolved.indexOf(id)}] (${String(tile.get("type"))}${content ? "" : ", empty"})`;
    return content ? `${header}\n${content}` : header;
  };

  return resolved.map((id) => {
    if (id === BODY_ID) {
      return {
        id,
        type: "TEXT",
        content: body ? fragmentToMarkdown(body, { tile: describe }) : "",
      };
    }
    const tile = tiles.get(id);
    const type = tile?.get("type") as TileType;
    return { id, type, content: tile ? getTileContent(tile) : "" };
  });
}

export function getTileContent(tile: Y.Map<unknown>): string {
  return TILE_CONTENT[tile.get("type") as TileType]?.(tile) ?? "";
}

function getTextContent(tile: Y.Map<unknown>): string {
  const content = tile.get("content");
  return content instanceof Y.XmlFragment ? fragmentToMarkdown(content) : "";
}

function getImageContent(tile: Y.Map<unknown>): string {
  const text = tile.get("text");
  return Array.isArray(text) ? toMarkdown(text as RichText) : "";
}

function getVideoContent(tile: Y.Map<unknown>): string {
  return joinLines(getString(tile, "title"), getString(tile, "description"));
}

function getLinkContent(tile: Y.Map<unknown>): string {
  return joinLines(
    getString(tile, "title"),
    getString(tile, "description"),
    getString(tile, "url"),
  );
}

function getPageLinkContent(tile: Y.Map<unknown>): string {
  return getTitle(tile.get("linkedPage"));
}

function getChartContent(tile: Y.Map<unknown>): string {
  const parts: string[] = [];

  const label = getTitle(tile.get("label"));
  if (label) {
    parts.push(`Labels: ${label}`);
  }

  const series = tile.get("series");
  if (series instanceof Y.Map) {
    const names: string[] = [];
    for (const entry of series.values()) {
      const name = entry instanceof Y.Map ? getTitle(entry.get("column")) : "";
      if (name) {
        names.push(name);
      }
    }
    if (names.length > 0) {
      parts.push(`Series: ${names.join(", ")}`);
    }
  }

  return parts.join("\n");
}

function getTableContent(tile: Y.Map<unknown>): string {
  const columnsMap = tile.get("columns");
  const rowsMap = tile.get("rows");
  if (!(columnsMap instanceof Y.Map) || !(rowsMap instanceof Y.Map)) {
    return "";
  }

  const columns = orderedEntries(columnsMap);
  if (columns.length === 0) {
    return "";
  }

  const headers = columns.map(({ map }) => escapeCell(getString(map, "title")));
  const lines = [`| ${headers.join(" | ")} |`, `| ${headers.map(() => "---").join(" | ")} |`];

  for (const { map } of orderedEntries(rowsMap)) {
    const values = columns.map(({ id }) => formatCell(getCell(map, id)));
    lines.push(`| ${values.join(" | ")} |`);
  }

  return lines.join("\n");
}

function formatCell(value: unknown): string {
  if (typeof value === "string") {
    return escapeCell(value);
  }
  if (Array.isArray(value)) {
    return escapeCell(toMarkdown(value as RichText));
  }
  return "";
}

/**
 * Escapes cell content so a value stays within one table cell.
 */
function escapeCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/[\r\n]+/g, " ");
}

/** Content tile ids in order: the body before its embedded tiles, sections as their children. */
function expandReferences(
  tiles: Y.Map<Y.Map<unknown>>,
  ids: string[],
  body: Y.XmlFragment | null,
): string[] {
  const resolved = new Set<string>();
  const visit = (id: string) => {
    if (id === BODY_ID) {
      if (body) {
        resolved.add(id);
        getTileIds(body).forEach(visit);
      }
      return;
    }
    const tile = tiles.get(id);
    if (!tile) {
      return;
    }
    if (tile.get("type") === "SECTION") {
      for (const child of getChildren(tiles, id)) {
        visit(child.id);
      }
    } else {
      resolved.add(id);
    }
  };
  ids.forEach(visit);
  return Array.from(resolved);
}

function joinLines(...values: string[]): string {
  return values.filter((value) => value.length > 0).join("\n");
}

function getString(tile: Y.Map<unknown>, key: string): string {
  const value = tile.get(key);
  return typeof value === "string" ? value : "";
}

function getTitle(value: unknown): string {
  if (value && typeof value === "object" && "title" in value) {
    const { title } = value;
    return typeof title === "string" ? title : "";
  }
  return "";
}
