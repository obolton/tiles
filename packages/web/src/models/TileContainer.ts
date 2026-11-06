import type * as Y from "yjs";
import type { PlacementInput } from "doc/tiles/base";
import type Tile from "./Tile";

export type TilePlacementInput = PlacementInput;

/**
 * Something that holds tiles: a page root, section or dock collection ordered by `order`, or a
 * document body ordered by the position of each tile's node in its rich text.
 */
export interface TileContainer {
  /** Attaches a new map, already carrying its id, and returns the constructed tile. */
  insert(id: string, map: Y.Map<unknown>, placement: TilePlacementInput): Tile;
  remove(tiles: readonly Tile[]): void;
  previous(tile: Tile): Tile | null;
  next(tile: Tile): Tile | null;
  /** Copies the tile in place, directly after the original. */
  duplicate(tile: Tile): Tile;
}
