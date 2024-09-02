import type {
  ImageTile,
  VideoTile,
  TextTile,
  PlaceTile,
  LinkTile,
  HeadingTile,
  PageLinkTile,
  EventTile,
  Collection,
  CollectionItem,
  Tile,
  TileType,
  Theme,
} from "@prisma/client";

type OmitMetadata<T> = Omit<T, "id" | "createdAt" | "updatedAt">;

type ClientTileBase = Pick<
  Tile,
  "id" | "type" | "position" | "columns" | "rows"
>;

// Image
export type ClientImage = OmitMetadata<ImageTile>;
export interface ClientImageTile extends ClientTileBase {
  type: "IMAGE";
  image: ClientImage;
}

// Video
export type ClientVideo = OmitMetadata<VideoTile>;
export interface ClientVideoTile extends ClientTileBase {
  type: "VIDEO";
  video: ClientVideo;
}

// Text
export type ClientText = OmitMetadata<TextTile>;
export interface ClientTextTile extends ClientTileBase {
  type: "TEXT";
  text: ClientText;
}

// Place
export type ClientPlace = OmitMetadata<PlaceTile>;
export interface ClientPlaceTile extends ClientTileBase {
  type: "PLACE";
  place: ClientPlace;
}

// Link
export type ClientLink = OmitMetadata<LinkTile>;
export interface ClientLinkTile extends ClientTileBase {
  type: "LINK";
  link: ClientLink;
}

// Page link
export type ClientPageLink = OmitMetadata<PageLinkTile> & {
  page: {
    title: string;
    subtitle: string | null;
    author: { name: string; imageUrl: string | null };
    theme: Theme;
    hue: number | null;
    font: string | null;
    imageKey: string | null;
  } | null;
};
export interface ClientPageLinkTile extends ClientTileBase {
  type: "PAGE_LINK";
  pageLink: ClientPageLink;
}

// Heading
export type ClientHeading = OmitMetadata<HeadingTile>;
export interface ClientHeadingTile extends ClientTileBase {
  type: "HEADING";
  heading: ClientHeading;
}

// Event
export type ClientEvent = OmitMetadata<Omit<EventTile, "start" | "end">> & {
  start: string;
  end: string | null;
};
export interface ClientEventTile extends ClientTileBase {
  type: "EVENT";
  event: ClientEvent;
}

// Collection
export type ClientCollection = OmitMetadata<Omit<Collection, "userId">> & {
  id: string;
  items: (Pick<CollectionItem, "id" | "position"> & {
    image: ClientImage | null;
    video: ClientVideo | null;
    text: ClientText | null;
    place: ClientPlace | null;
    link: ClientLink | null;
  })[];
};
export interface ClientCollectionTile extends ClientTileBase {
  type: "COLLECTION";
  collection: ClientCollection;
}

export type ClientEntity =
  | ClientImage
  | ClientVideo
  | ClientText
  | ClientPlace
  | ClientLink
  | ClientHeading
  | ClientPageLink
  | ClientEvent
  | ClientCollection;

export type ClientTile =
  | ClientImageTile
  | ClientVideoTile
  | ClientTextTile
  | ClientPlaceTile
  | ClientLinkTile
  | ClientHeadingTile
  | ClientPageLinkTile
  | ClientEventTile
  | ClientCollectionTile;

export type { TileType };
