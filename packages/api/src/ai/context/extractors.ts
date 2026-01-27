import { toMarkdown } from "./markdown";
import { toMarkdownTable } from "./table";
import type {
  ClientTile,
  ClientTextTile,
  ClientImageTile,
  ClientVideoTile,
  ClientLinkTile,
  ClientMapTile,
  ClientPageLinkTile,
  ClientChartTile,
} from "@/types/tiles";
import type { RichTextSchema } from "@/schema/RichText";

function extractTextContent(tile: ClientTextTile): string {
  return toMarkdown(tile.content as RichTextSchema);
}

function extractImageContent(tile: ClientImageTile): string {
  if (!tile.text) {
    return "";
  }
  return toMarkdown(tile.text as RichTextSchema);
}

function extractVideoContent(tile: ClientVideoTile): string {
  const parts: string[] = [];
  if (tile.title) {
    parts.push(tile.title);
  }
  if (tile.description) {
    parts.push(tile.description);
  }
  return parts.join("\n");
}

function extractLinkContent(tile: ClientLinkTile): string {
  const parts: string[] = [];
  if (tile.title) {
    parts.push(tile.title);
  }
  if (tile.description) {
    parts.push(tile.description);
  }
  parts.push(tile.url);
  return parts.join("\n");
}

function extractMapContent(tile: ClientMapTile): string {
  return tile.places
    .map((place) => [place.name, place.address].filter(Boolean).join(" - "))
    .join("\n");
}

function extractPageLinkContent(tile: ClientPageLinkTile): string {
  return tile.linkedPage?.title ?? "";
}

function extractChartContent(tile: ClientChartTile): string {
  const parts: string[] = [];
  if (tile.label?.title) {
    parts.push(`Labels: ${tile.label.title}`);
  }
  const seriesNames = tile.series
    .map((s) => s.column?.title)
    .filter(Boolean)
    .join(", ");
  if (seriesNames) {
    parts.push(`Series: ${seriesNames}`);
  }
  return parts.join("\n");
}

/**
 * Extract text content from a tile for use as AI context.
 */
export function extractContent(tile: ClientTile): string {
  switch (tile.type) {
    case "TEXT":
      return extractTextContent(tile);
    case "TABLE":
      return toMarkdownTable(tile);
    case "IMAGE":
      return extractImageContent(tile);
    case "VIDEO":
      return extractVideoContent(tile);
    case "LINK":
      return extractLinkContent(tile);
    case "MAP":
      return extractMapContent(tile);
    case "PAGE_LINK":
      return extractPageLinkContent(tile);
    case "CHART":
      return extractChartContent(tile);
    default:
      return "";
  }
}
