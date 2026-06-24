import type { TextTile } from "./tiles/text";
import type { ImageTile } from "./tiles/image";
import type { VideoTile } from "./tiles/video";
import type { LinkTile } from "./tiles/link";
import type { PageLinkTile } from "./tiles/pageLink";
import type { TableTile } from "./tiles/table";
import type { ChartTile } from "./tiles/chart";
import type { SectionTile } from "./tiles/section";

export * from "./tiles/base";
export * from "./tiles/text";
export * from "./tiles/image";
export * from "./tiles/video";
export * from "./tiles/link";
export * from "./tiles/pageLink";
export * from "./tiles/table";
export * from "./tiles/chart";
export * from "./tiles/section";

export type Tile =
  | TextTile
  | ImageTile
  | VideoTile
  | LinkTile
  | PageLinkTile
  | TableTile
  | ChartTile
  | SectionTile;
