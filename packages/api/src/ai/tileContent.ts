import * as Y from "yjs";
import { getChildren } from "doc/placement/ordering";
import { fragmentToMarkdown } from "doc/richText/markdown";
import { toMarkdown } from "@/ai/context/markdown";
import type { RichTextSchema } from "@/schema/RichText";
import type { TileType } from "@/types/tiles";

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
  CHART: getChartContent,
};

/**
 * Resolves tile IDs to their content from a Y.Doc.
 */
export function resolveTileContents(doc: Y.Doc, ids: string[]): TileContent[] {
  const tiles = doc.getMap<Y.Map<unknown>>("tiles");
  const contents: TileContent[] = [];

  for (const id of expandSections(tiles, ids)) {
    const tile = tiles.get(id);
    const type = tile?.get("type") as TileType | undefined;
    if (!tile || !type || type === "SECTION") {
      continue;
    }
    contents.push({ id, type, content: getTileContent(tile) });
  }

  return contents;
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
  return Array.isArray(text) ? toMarkdown(text as RichTextSchema) : "";
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

function expandSections(tiles: Y.Map<Y.Map<unknown>>, ids: string[]): string[] {
  const resolved = new Set<string>();
  for (const id of ids) {
    if (tiles.get(id)?.get("type") === "SECTION") {
      for (const child of getChildren(tiles, id)) {
        resolved.add(child.id);
      }
    } else {
      resolved.add(id);
    }
  }
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
    const { title } = value as { title: unknown };
    return typeof title === "string" ? title : "";
  }
  return "";
}
