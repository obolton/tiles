import type {
  ClientTile,
  ClientCollection,
  ClientCollectionTile,
} from "@/types/tiles";
import type { Reactive } from "@/utils/reactivity";

export type LeafTile = Exclude<ClientTile, ClientCollectionTile>;

export type CollectionTile = ClientCollectionTile & { tiles: LeafTile[] };

export type Tile = LeafTile | CollectionTile;

export type Section = ClientCollection & {
  tiles: Reactive<Tile[]>;
};

export type Layout = Section[];
