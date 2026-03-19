import Chip from "./Chip";
import TextIcon from "@/icons/text.svg?jsx";
import ImageIcon from "@/icons/image.svg?jsx";
import VideoIcon from "@/icons/video.svg?jsx";
import TableIcon from "@/icons/table.svg?jsx";
import ChartIcon from "@/icons/chart.svg?jsx";
import LinkIcon from "@/icons/link.svg?jsx";
import GridLayoutIcon from "@/icons/grid-layout.svg?jsx";
import { getTileLabel } from "@/utils/tileLabel";
import type Tile from "@/models/Tile";
import type { TileType } from "api/types/tiles";
import type { JSX } from "@/jsx/jsx";

const TILE_ICONS: Record<TileType, JSX.Component<JSX.Attributes<"svg">>> = {
  TEXT: TextIcon,
  IMAGE: ImageIcon,
  VIDEO: VideoIcon,
  TABLE: TableIcon,
  CHART: ChartIcon,
  LINK: LinkIcon,
  PAGE_LINK: LinkIcon,
  SECTION: GridLayoutIcon,
};

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
