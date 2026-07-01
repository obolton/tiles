import TextIcon from "@/icons/text.svg?jsx";
import ImageIcon from "@/icons/image.svg?jsx";
import VideoIcon from "@/icons/video.svg?jsx";
import TableIcon from "@/icons/table.svg?jsx";
import ChartIcon from "@/icons/chart.svg?jsx";
import LinkIcon from "@/icons/link.svg?jsx";
import GridLayoutIcon from "@/icons/grid-layout.svg?jsx";
import type { TileType } from "doc/types/enums";
import type { JSX } from "@/jsx/jsx";

export const TILE_ICONS: Record<TileType, JSX.Component<JSX.Attributes<"svg">>> = {
  TEXT: TextIcon,
  IMAGE: ImageIcon,
  VIDEO: VideoIcon,
  TABLE: TableIcon,
  CHART: ChartIcon,
  LINK: LinkIcon,
  PAGE_LINK: LinkIcon,
  SECTION: GridLayoutIcon,
};
