import type {
  ClientTile,
  ClientCollection,
  ClientCollectionTile,
} from "@/types/tiles";

export type LeafTile = Exclude<ClientTile, ClientCollectionTile>;

export type CollectionTile = ClientCollectionTile & { tiles: LeafTile[] };

export type Tile = LeafTile | CollectionTile;

export type Section = ClientCollection & {
  tiles: Tile[];
};

export type Layout = Section[];
