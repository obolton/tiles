import type {
  ImageTile,
  VideoTile,
  MapTile,
  LinkTile,
  PageLinkTile,
  Place,
  Collection,
  Tile,
  TileType,
  Font,
  Table,
  TableColumn,
  TableRow,
} from "@prisma/client";
import type { Text } from "@/routes/text/text.ts";

type OmitMetadata<T> = Omit<T, "pageId" | "createdAt" | "updatedAt">;

type ClientTileBase = Pick<
  Tile,
  "id" | "type" | "position" | "width" | "height" | "parentCollectionId"
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
  linkedPage: {
    id: string;
    title: string;
    author?: { id: string; name: string; imageUrl: string | null };
    color: { l: number; c: number; h: number };
    font: Font | null;
    coverImageUrl: string | null;
  } | null;
};
export interface ClientPageLinkTile extends ClientTileBase, ClientPageLink {
  type: "PAGE_LINK";
}

// Table
export type ClientTable = OmitMetadata<Table> & {
  tableColumns: Pick<TableColumn, "id" | "width">[];
  tableRows: Pick<TableRow, "id" | "data">[];
  numRows: number;
};
export interface ClientTableTile extends ClientTileBase, ClientTable {
  type: "TABLE";
}

// Collection
export type ClientCollection = OmitMetadata<Omit<Collection, "userId">>;

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
