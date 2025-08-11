import type {
  ImageTile,
  VideoTile,
  MapTile,
  LinkTile,
  PageLinkTile,
  Place,
  Section,
  Tile,
  TileType,
} from "@prisma/client";
import type { Text } from "@/routes/text/text.ts";
import type { TableWithData } from "@/routes/tables/tables.ts";
import type { PageLinkPage } from "@/routes/pageLinks/pageLinks.ts";

type OmitMetadata<T> = Omit<T, "pageId" | "createdAt" | "updatedAt">;

type ClientTileBase = Pick<
  Tile,
  "id" | "type" | "position" | "x" | "y" | "width" | "height" | "sectionId"
> & { placementId: string };

// Image
export type ClientImage = Omit<OmitMetadata<ImageTile>, "imageKey"> & {
  imageUrl: string;
};
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
export type ClientPlace = OmitMetadata<Omit<Place, "mapTileId">> & {
  id: string;
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

// Collection
export type ClientCollection = OmitMetadata<Omit<Section, "userId">>;

export type ClientEntity =
  | ClientImage
  | ClientVideo
  | ClientText
  | ClientPlace
  | ClientMap
  | ClientLink
  | ClientPageLink
  | ClientCollection
  | ClientTable;

export type ClientTile =
  | ClientImageTile
  | ClientVideoTile
  | ClientTextTile
  | ClientMapTile
  | ClientLinkTile
  | ClientPageLinkTile
  | ClientTableTile;

export type { TileType };
