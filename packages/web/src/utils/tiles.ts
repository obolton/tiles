import { toPlainText } from "@/utils/richText/plainText";
import Text from "@/models/Text";
import Image from "@/models/Image";
import Table from "@/models/Table";
import Chart from "@/models/Chart";
import Map from "@/models/Map";
import Link from "@/models/Link";
import PageLink from "@/models/PageLink";
import Video from "@/models/Video";
import type Tile from "@/models/Tile";

const MAX_LABEL_LENGTH = 50;

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength).trim() + "…";
}

export function getTileLabel(tile: Tile): string {
  if (tile instanceof Text) {
    const firstLine = toPlainText(tile.content.value).split("\n")[0]?.trim();
    return firstLine ? truncate(firstLine, MAX_LABEL_LENGTH) : "Text";
  }

  if (tile instanceof Image) {
    const caption = tile.text.value ? toPlainText(tile.text.value).trim() : "";
    return caption ? truncate(caption, MAX_LABEL_LENGTH) : "Image";
  }

  if (tile instanceof Table) {
    return tile.columns.value[0]?.title || "Table";
  }

  if (tile instanceof Chart) {
    return tile.label.value?.title || "Chart";
  }

  if (tile instanceof Map) {
    const count = tile.places.value.length;
    if (count === 0) {
      return "Map";
    }
    if (count === 1) {
      return tile.places.value[0]?.name || "Map";
    }
    return `Map (${count} places)`;
  }

  if (tile instanceof Link) {
    return tile.title.value || "Link";
  }

  if (tile instanceof PageLink) {
    return tile.linkedPage?.title || "Page";
  }

  if (tile instanceof Video) {
    return tile.title.value || "Video";
  }

  if (tile.type === "SECTION") {
    return "Section";
  }

  return "Tile";
}
