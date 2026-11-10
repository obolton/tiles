import * as Y from "yjs";
import { getChildren, orderedEntries } from "../placement/ordering";
import { getCell } from "../tiles/table";
import { getVideoUrl } from "../tiles/video";
import { VideoType } from "../types/enums";
import { TextFormat } from "../types/richText";
import { escapeText, inlineToMarkdown } from "./inline";
import { fragmentToMarkdown, richTextToMarkdown } from "./richText";

export interface TileMarkdownOptions {
  tiles: Y.Map<Y.Map<unknown>>;
  imageUrl?: (imageId: string) => string;
  pageUrl?: (pageId: string) => string;
  tile?: (id: string) => string;
}

type Serializer = (tile: Y.Map<unknown>, options: TileMarkdownOptions) => string;

const SERIALIZERS: Record<string, Serializer> = {
  TEXT: renderText,
  IMAGE: renderImage,
  VIDEO: renderVideo,
  LINK: renderLink,
  PAGE_LINK: renderPageLink,
  TABLE: renderTable,
  CHART: renderChart,
  SECTION: renderSection,
};

/**
 * Serializes a tile to Markdown. The tile's own `hide` flag is not consulted, so a tile that is
 * referenced directly still renders; {@link renderTile} skips hidden tiles.
 */
export function tileToMarkdown(tile: Y.Map<unknown>, options: TileMarkdownOptions): string {
  const type = tile.get("type");
  const serializer = typeof type === "string" ? SERIALIZERS[type] : undefined;
  return serializer?.(tile, options) ?? "";
}

/** Serializes the tile with the id, or nothing for a missing or hidden tile. */
export function renderTile(id: string, options: TileMarkdownOptions): string {
  const tile = options.tiles.get(id);
  return tile && !isHidden(tile) ? tileToMarkdown(tile, options) : "";
}

export function isHidden(tile: Y.Map<unknown>): boolean {
  return tile.get("hide") === true;
}

function childRenderer(options: TileMarkdownOptions): (id: string) => string {
  return options.tile ?? ((id) => renderTile(id, options));
}

function renderText(tile: Y.Map<unknown>, options: TileMarkdownOptions): string {
  const content = tile.get("content");
  return content instanceof Y.XmlFragment
    ? fragmentToMarkdown(content, { tile: childRenderer(options) })
    : "";
}

function renderImage(tile: Y.Map<unknown>, options: TileMarkdownOptions): string {
  const imageId = getString(tile, "imageId");
  const image =
    options.imageUrl && imageId
      ? `![${escapeText(getString(tile, "alt"))}](${options.imageUrl(imageId)})`
      : "";
  return joinBlocks(image, richText(tile.get("text")));
}

function renderVideo(tile: Y.Map<unknown>): string {
  const videoType = tile.get("videoType");
  const videoId = getString(tile, "videoId");
  if (!isVideoType(videoType) || !videoId) {
    return "";
  }
  const url = getVideoUrl(videoType, videoId);
  return joinBlocks(link(getString(tile, "title"), url), paragraph(getString(tile, "description")));
}

function renderLink(tile: Y.Map<unknown>): string {
  const url = getString(tile, "url");
  if (!url) {
    return "";
  }
  const title = getString(tile, "title") || getString(tile, "siteName");
  return joinBlocks(link(title, url), paragraph(getString(tile, "description")));
}

function renderPageLink(tile: Y.Map<unknown>, options: TileMarkdownOptions): string {
  const linkedPage = tile.get("linkedPage");
  const id = getField(linkedPage, "id");
  const title = getField(linkedPage, "title");
  if (options.pageUrl && id) {
    return link(title, options.pageUrl(id));
  }
  return paragraph(title);
}

function renderTable(tile: Y.Map<unknown>): string {
  const columnsMap = tile.get("columns");
  const rowsMap = tile.get("rows");
  if (!(columnsMap instanceof Y.Map) || !(rowsMap instanceof Y.Map)) {
    return "";
  }

  const columns = orderedEntries(columnsMap);
  if (columns.length === 0) {
    return "";
  }

  const headers = columns.map(({ map }) => cell(getString(map, "title")));
  const lines = [row(headers), row(headers.map(() => "---"))];
  for (const { map } of orderedEntries(rowsMap)) {
    lines.push(row(columns.map(({ id }) => cell(getCell(map, id)))));
  }
  return lines.join("\n");
}

function row(cells: string[]): string {
  return `| ${cells.join(" | ")} |`;
}

/** A cell's content on one line, with pipes escaped so it stays within its cell. */
function cell(value: unknown): string {
  const text = typeof value === "string" ? escapeText(value) : richText(value);
  return text.replace(/\s*[\r\n]+\s*/g, " ").replace(/\|/g, "\\|");
}

function renderChart(tile: Y.Map<unknown>): string {
  const label = getField(tile.get("label"), "title");
  const seriesMap = tile.get("series");
  const series =
    seriesMap instanceof Y.Map
      ? orderedEntries(seriesMap).flatMap(({ map }) => {
          const title = getField(map.get("column"), "title");
          return title ? [title] : [];
        })
      : [];

  let description = "Chart";
  if (series.length > 0) {
    description += `: ${series.join(", ")}`;
  }
  if (label) {
    description += ` by ${label}`;
  }
  return `*${escapeText(description)}*`;
}

function renderSection(tile: Y.Map<unknown>, options: TileMarkdownOptions): string {
  const id = getString(tile, "id");
  if (!id) {
    return "";
  }
  const render = childRenderer(options);
  return joinBlocks(...getChildren(options.tiles, id).map((child) => render(child.id)));
}

function link(text: string, href: string): string {
  return inlineToMarkdown([
    { type: "link", href, children: [{ type: "text", text, format: TextFormat.NONE }] },
  ]);
}

/** Plain text as a paragraph of its own. */
function paragraph(text: string): string {
  return escapeText(text.trim(), true);
}

function richText(value: unknown): string {
  return Array.isArray(value) ? richTextToMarkdown(value) : "";
}

function joinBlocks(...blocks: string[]): string {
  return blocks.filter((block) => block.length > 0).join("\n\n");
}

function isVideoType(value: unknown): value is VideoType {
  return typeof value === "string" && Object.hasOwn(VideoType, value);
}

function getString(tile: Y.Map<unknown>, key: string): string {
  const value = tile.get(key);
  return typeof value === "string" ? value : "";
}

function getField(value: unknown, key: string): string {
  const field: unknown =
    typeof value === "object" && value !== null ? Reflect.get(value, key) : undefined;
  return typeof field === "string" ? field : "";
}
