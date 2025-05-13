import type {
  ImageTile,
  VideoTile,
  TextTile,
  MapTile,
  LinkTile,
  PageLinkTile,
  Place,
  Collection,
  Tile,
  TileType,
  Theme,
  Font,
  Table,
  TableRow,
} from "@prisma/client";

type OmitMetadata<T> = Omit<T, "pageId" | "createdAt" | "updatedAt">;

type ClientTileBase = Pick<
  Tile,
  "id" | "type" | "position" | "columns" | "rows" | "parentCollectionId"
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
export type ClientText = OmitMetadata<TextTile>;
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
    subtitle: string | null;
    author?: { id: string; name: string; imageUrl: string | null };
    theme: Theme;
    hue: number | null;
    font: Font | null;
    coverImageUrl: string | null;
  } | null;
};
export interface ClientPageLinkTile extends ClientTileBase, ClientPageLink {
  type: "PAGE_LINK";
}

// Table
export type ClientTable = OmitMetadata<Table> & {
  data: Pick<TableRow, "id" | "data">[];
};
export interface ClientTableTile extends ClientTileBase, ClientTable {
  type: "TABLE";
}

// Collection
export type ClientCollection = OmitMetadata<Omit<Collection, "userId">>;
export interface ClientCollectionTile
  extends ClientTileBase,
    Omit<ClientCollection, "type"> {
  type: "COLLECTION";
}

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
  | ClientCollectionTile
  | ClientTableTile;

export type { TileType };
