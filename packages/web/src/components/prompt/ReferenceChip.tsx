import Chip from "./Chip";
import TextIcon from "@/icons/text.svg?jsx";
import ImageIcon from "@/icons/image.svg?jsx";
import VideoIcon from "@/icons/video.svg?jsx";
import TableIcon from "@/icons/table.svg?jsx";
import ChartIcon from "@/icons/chart.svg?jsx";
import PlaceIcon from "@/icons/place.svg?jsx";
import LinkIcon from "@/icons/link.svg?jsx";
import GridLayoutIcon from "@/icons/grid-layout.svg?jsx";
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
import type { TileType } from "api/types/tiles";
import type { JSX } from "@/jsx/jsx";

const TILE_ICONS: Record<TileType, JSX.Component<JSX.Attributes<"svg">>> = {
  TEXT: TextIcon,
  IMAGE: ImageIcon,
  VIDEO: VideoIcon,
  TABLE: TableIcon,
  CHART: ChartIcon,
  MAP: PlaceIcon,
  LINK: LinkIcon,
  PAGE_LINK: LinkIcon,
  SECTION: GridLayoutIcon,
};

const MAX_LABEL_LENGTH = 50;

interface ReferenceChipProps {
  tile: Tile;
  onRemove: () => void;
}

export default function ReferenceChip({ tile, onRemove }: ReferenceChipProps) {
  const icon = TILE_ICONS[tile.type] ?? TextIcon;
  const label = getTileLabel(tile);

  return (
    <Chip icon={icon} label={label} href={`#${tile.id}`} onRemove={onRemove} />
  );
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength).trim() + "…";
}

function getTileLabel(tile: Tile): string {
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
    return tile.page?.title || "Page";
  }

  if (tile instanceof Video) {
    return tile.title.value || "Video";
  }

  if (tile.type === "SECTION") {
    return "Section";
  }

  return "Tile";
}
