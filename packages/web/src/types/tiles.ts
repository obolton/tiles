import type {
  ClientCollection,
  ClientCollectionTile,
  ClientImageTile,
  ClientLinkTile,
  ClientMapTile,
  ClientPageLinkTile,
  ClientTableTile,
  ClientTextTile,
  ClientTile,
  ClientVideoTile,
  TileType,
} from "api/src/types/tiles.ts";
import type { Reactive, ReactiveRecord } from "@/utils/reactivity";

export type { ClientCollection, ClientTile, TileType };

export type ReactiveTile<T extends ClientTile = ClientTile> =
  T extends ClientTile
    ? Pick<T, "id" | "placementId" | "type"> &
        ReactiveRecord<Omit<T, "id" | "placementId" | "type">>
    : never;

export type CollectionProperties = ReactiveTile<ClientCollectionTile> & {
  tiles: Reactive<LeafTile[]>;
};
export type ImageProperties = ReactiveTile<ClientImageTile>;
export type LinkProperties = ReactiveTile<ClientLinkTile>;
export type MapProperties = ReactiveTile<ClientMapTile>;
export type PageLinkProperties = ReactiveTile<ClientPageLinkTile>;
export type TableProperties = ReactiveTile<ClientTableTile>;
export type TextProperties = ReactiveTile<ClientTextTile>;
export type VideoProperties = ReactiveTile<ClientVideoTile>;

export type Tile =
  | CollectionProperties
  | ImageProperties
  | LinkProperties
  | MapProperties
  | PageLinkProperties
  | TableProperties
  | TextProperties
  | VideoProperties;

export type TableTile = ReactiveTile<ClientTableTile>;

export type LeafTile = Exclude<Tile, CollectionProperties>;

export type Section = ClientCollection & {
  tiles: Reactive<Tile[]>;
};

export type Layout = Section[];
