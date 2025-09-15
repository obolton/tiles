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
import type {
  Reactive,
  ReactiveRecord,
  ComputedReactive,
} from "@/utils/reactivity";
import type { EditorState } from "prosemirror-state";

export type { ClientCollection, ClientPageLinkTile, ClientTile, TileType };

export type ReactiveTile<T extends ClientTile = ClientTile> =
  T extends ClientTile
    ? Pick<T, "id" | "placementId" | "type"> &
        ReactiveRecord<Omit<T, "id" | "placementId" | "type">>
    : never;

export type TextProperties = ReactiveTile<ClientTextTile> & {
  state: Reactive<EditorState | null>;
};
export type ImageProperties = ReactiveTile<ClientImageTile> & {
  state: Reactive<EditorState | null>;
};
export type LinkProperties = ReactiveTile<ClientLinkTile>;
export type MapProperties = ReactiveTile<ClientMapTile>;
export type PageLinkProperties = ReactiveTile<ClientPageLinkTile>;
export type TableProperties = ReactiveTile<ClientTableTile>;
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
  tiles: ComputedReactive<Tile[]>;
}

export type Layout = SectionWithTiles[];
