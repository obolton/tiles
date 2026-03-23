import type {
  VideoTile,
  LinkTile,
  PageLinkTile,
  TileType,
  Layout,
  Sizing,
  Animation,
  FrameStyle,
  MapStyle,
  DockEdge,
} from "@/generated/prisma/client";
import type { TileBase } from "@/routes/tiles/fields";
import type { Section } from "@/routes/sections/fields";
import type { Text } from "@/routes/text/fields";
import type { Image } from "@/routes/images/fields";
import type { TableWithData } from "@/routes/tables/fields";
import type { Chart, ChartSeries } from "@/routes/charts/fields";
import type { PageLinkPage } from "@/routes/pageLinks/fields";

type OmitMetadata<T> = Omit<T, "pageId" | "createdAt" | "updatedAt">;

export type ClientTileBase = TileBase;

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

// Link
export type ClientLink = Omit<OmitMetadata<LinkTile>, "imageId"> & {
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
  | ClientLink
  | ClientPageLink
  | ClientTable
  | ClientChart;

export type ClientTile =
  | ClientSectionTile
  | ClientImageTile
  | ClientVideoTile
  | ClientTextTile
  | ClientLinkTile
  | ClientPageLinkTile
  | ClientTableTile
  | ClientChartTile;

export type {
  TileType,
  ChartSeries,
  Layout,
  Sizing,
  Animation,
  FrameStyle,
  MapStyle,
  DockEdge,
};
