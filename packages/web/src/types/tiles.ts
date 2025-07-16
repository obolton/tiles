import type {
  ClientCollection,
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

export type { ClientCollection, ClientPageLinkTile, ClientTile, TileType };

export type ReactiveTile<T extends ClientTile = ClientTile> =
  T extends ClientTile
    ? Pick<T, "id" | "placementId" | "type"> &
        ReactiveRecord<Omit<T, "id" | "placementId" | "type">>
    : never;

export type ImageProperties = ReactiveTile<ClientImageTile>;
export type LinkProperties = ReactiveTile<ClientLinkTile>;
export type MapProperties = ReactiveTile<ClientMapTile>;
export type PageLinkProperties = ReactiveTile<ClientPageLinkTile>;
export type TableProperties = ReactiveTile<ClientTableTile>;
export type TextProperties = ReactiveTile<ClientTextTile>;
export type VideoProperties = ReactiveTile<ClientVideoTile>;

export type Tile =
  | ImageProperties
  | LinkProperties
  | MapProperties
  | PageLinkProperties
  | TableProperties
  | TextProperties
  | VideoProperties;

export type Section = Pick<ClientCollection, "id"> &
  ReactiveRecord<Omit<ClientCollection, "id">>;

export interface SectionWithTiles extends Section {
  tiles: Reactive<Tile[]>;
}

export type Layout = SectionWithTiles[];
