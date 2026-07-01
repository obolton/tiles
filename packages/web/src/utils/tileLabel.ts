import { fragmentToPlainText, toPlainText } from "@/utils/richText/plainText";
import Text from "@/models/Text";
import Image from "@/models/Image";
import Table from "@/models/Table";
import Chart from "@/models/Chart";
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
    const firstLine = fragmentToPlainText(tile.contentFragment).split("\n")[0]?.trim();
    return firstLine ? truncate(firstLine, MAX_LABEL_LENGTH) : "Text";
  }

  if (tile instanceof Image) {
    const caption = tile.text.value ? toPlainText(tile.text.value).trim() : "";
    return caption ? truncate(caption, MAX_LABEL_LENGTH) : "Image";
  }

  if (tile instanceof Table) {
    return tile.columns.value[0]?.title.value || "Table";
  }

  if (tile instanceof Chart) {
    return tile.label.value?.title || "Chart";
  }

  if (tile instanceof Link) {
    return tile.title.value || "Link";
  }

  if (tile instanceof PageLink) {
    return tile.linkedPage.value?.title || "Page";
  }

  if (tile instanceof Video) {
    return tile.title.value || "Video";
  }

  if (tile.type === "SECTION") {
    return "Section";
  }

  return "Tile";
}
