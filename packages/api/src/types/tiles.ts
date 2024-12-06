import type {
  ImageTile,
  VideoTile,
  TextTile,
  MapTile,
  LinkTile,
  HeadingTile,
  PageLinkTile,
  Place,
  EventTile,
  Collection,
  Tile,
  TileType,
  Theme,
  Font,
} from "@prisma/client";

type OmitMetadata<T> = Omit<T, "id" | "createdAt" | "updatedAt">;

type ClientTileBase = Pick<
  Tile,
  "id" | "type" | "position" | "columns" | "rows"
> & { placementId: string };

// Image
export type ClientImage = OmitMetadata<ImageTile>;
export interface ClientImageTile extends ClientTileBase, ClientImage {
  type: "IMAGE";
}

// Video
export type ClientVideo = OmitMetadata<VideoTile>;
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
export type ClientLink = OmitMetadata<LinkTile>;
export interface ClientLinkTile extends ClientTileBase, ClientLink {
  type: "LINK";
}

// Page link
export type ClientPageLink = OmitMetadata<PageLinkTile> & {
  page: {
    id: string;
    title: string;
    subtitle: string | null;
    author: { id: string; name: string; imageUrl: string | null };
    theme: Theme;
    hue: number | null;
    font: Font | null;
    imageKey: string | null;
  } | null;
};
export interface ClientPageLinkTile extends ClientTileBase, ClientPageLink {
  type: "PAGE_LINK";
}

// Heading
export type ClientHeading = OmitMetadata<HeadingTile>;
export interface ClientHeadingTile extends ClientTileBase, ClientHeading {
  type: "HEADING";
}

// Event
export type ClientEvent = OmitMetadata<Omit<EventTile, "start" | "end">> & {
  start: string;
  end: string | null;
};
export interface ClientEventTile extends ClientTileBase, ClientEvent {
  type: "EVENT";
}

// Collection
export type ClientCollection = OmitMetadata<
  Omit<Collection, "userId" | "type">
> & {
  items: ClientTile[];
};
export interface ClientCollectionTile extends ClientTileBase, ClientCollection {
  type: "COLLECTION";
}

export type ClientEntity =
  | ClientImage
  | ClientVideo
  | ClientText
  | ClientPlace
  | ClientMap
  | ClientLink
  | ClientHeading
  | ClientPageLink
  | ClientEvent
  | ClientCollection;

export type ClientTile =
  | ClientImageTile
  | ClientVideoTile
  | ClientTextTile
  | ClientMapTile
  | ClientLinkTile
  | ClientHeadingTile
  | ClientPageLinkTile
  | ClientEventTile
  | ClientCollectionTile;

export type { TileType };
