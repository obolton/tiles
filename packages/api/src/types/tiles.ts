import type {
  VideoTile,
  MapTile,
  LinkTile,
  PageLinkTile,
  Place,
  Tile,
  TileType,
  Layout,
  Anchor,
  Dimensions,
  Animation,
} from "@/generated/prisma/client";
import type { Section } from "@/routes/sections/sections";
import type { Text } from "@/routes/text/text";
import type { Image } from "@/routes/images/images";
import type { TableWithData } from "@/routes/tables/tables";
import type { Chart, ChartSeries } from "@/routes/charts/charts";
import type { PageLinkPage } from "@/routes/pageLinks/pageLinks";

type OmitMetadata<T> = Omit<T, "pageId" | "createdAt" | "updatedAt">;

type ClientTileBase = Pick<
  Tile,
  | "id"
  | "sectionId"
  | "type"
  | "order"
  | "anchor"
  | "dimensions"
  | "x"
  | "y"
  | "width"
  | "height"
  | "rowSpan"
  | "block"
  | "animation"
  | "hide"
>;

// Image
export type ClientImage = Image;
export interface ClientImageTile extends ClientTileBase, ClientImage {
  type: "IMAGE";
}

// Video
export type ClientVideo = Omit<OmitMetadata<VideoTile>, "originalImageUrl"> & {
  imageUrl: string | null;
};
export interface ClientVideoTile extends ClientTileBase, ClientVideo {
  type: "VIDEO";
}

// Text
export type ClientText = Text;
export interface ClientTextTile extends ClientTileBase, ClientText {
  type: "TEXT";
}

// Place
export type ClientPlace = OmitMetadata<
  Omit<Place, "mapTileId" | "boundingBox">
> & {
  id: string;
  boundingBox: number[] | null;
};

// Map
export type ClientMap = OmitMetadata<MapTile> & {
  places: ClientPlace[];
};
export interface ClientMapTile extends ClientTileBase, ClientMap {
  type: "MAP";
}

// Link
export type ClientLink = Omit<OmitMetadata<LinkTile>, "originalImageUrl"> & {
  imageUrl: string | null;
};
export interface ClientLinkTile extends ClientTileBase, ClientLink {
  type: "LINK";
}

// Page link
export type ClientPageLink = Omit<
  OmitMetadata<PageLinkTile>,
  "linkedPageId"
> & {
  linkedPage: PageLinkPage | null;
};
export interface ClientPageLinkTile extends ClientTileBase, ClientPageLink {
  type: "PAGE_LINK";
}

// Table
export type ClientTable = OmitMetadata<TableWithData>;
export interface ClientTableTile extends ClientTileBase, ClientTable {
  type: "TABLE";
}

// Chart
export type ClientChart = OmitMetadata<Chart>;
export interface ClientChartTile extends ClientTileBase, ClientChart {
  type: "CHART";
}

// Section
export type ClientSection = Section;
export interface ClientSectionTile extends ClientTileBase, ClientSection {
  type: "SECTION";
}

export type ClientEntity =
  | ClientSection
  | ClientImage
  | ClientVideo
  | ClientText
  | ClientPlace
  | ClientMap
  | ClientLink
  | ClientPageLink
  | ClientTable
  | ClientChart;

export type ClientTile =
  | ClientSectionTile
  | ClientImageTile
  | ClientVideoTile
  | ClientTextTile
  | ClientMapTile
  | ClientLinkTile
  | ClientPageLinkTile
  | ClientTableTile
  | ClientChartTile;

export type { TileType, ChartSeries, Layout, Anchor, Dimensions, Animation };
