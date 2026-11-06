import * as Y from "yjs";
import { reactive, type Reactive } from "reactivity";
import { getBody } from "doc/body";
import {
  findTile,
  getTileIds,
  insertTile,
  moveTile,
  positionAfterTile,
  removeTiles,
} from "doc/richText/tiles";
import type Page from "./Page";
import type Tile from "./Tile";
import type { TileContainer, TilePlacementInput } from "./TileContainer";

/**
 * The rich text body of a document page. Tiles embedded in it are root tiles of the page,
 * ordered by their node in the fragment rather than by an `order` key.
 */
export default class Body implements TileContainer {
  readonly page: Page;
  readonly fragment: Y.XmlFragment;

  /** The editing caret, written by the body editor, for inserting tiles after it. */
  readonly insertionPoint: Reactive<Y.RelativePosition | null> = reactive(null);

  constructor(page: Page) {
    this.page = page;
    this.fragment = getBody(page.doc);
  }

  private get tilesMap(): Y.Map<Y.Map<unknown>> {
    return this.page.doc.getMap<Y.Map<unknown>>("tiles");
  }

  /** Ids of the embedded tiles, in document order. */
  get tileIds(): string[] {
    return getTileIds(this.fragment);
  }

  contains(id: string): boolean {
    return findTile(this.fragment, id) !== null;
  }

  positionAfter(id: string): Y.RelativePosition | null {
    return positionAfterTile(this.fragment, id);
  }

  insert(id: string, map: Y.Map<unknown>, { at }: TilePlacementInput): Tile {
    map.set("parentId", null);
    this.page.doc.transact(() => {
      this.tilesMap.set(id, map);
      if (at !== null) {
        insertTile(this.fragment, id, at);
      }
    });
    return this.page.add(map);
  }

  remove(tiles: readonly Tile[]) {
    const ids = tiles.map((tile) => tile.id);
    this.page.doc.transact(() => {
      removeTiles(this.fragment, ids);
      for (const id of ids) {
        this.tilesMap.delete(id);
      }
    });
  }

  previous(): Tile | null {
    return null;
  }

  next(): Tile | null {
    return null;
  }

  moveUp(tile: Tile) {
    moveTile(this.fragment, tile.id, -1);
  }

  moveDown(tile: Tile) {
    moveTile(this.fragment, tile.id, 1);
  }

  duplicate(tile: Tile): Tile {
    return tile.clone({ parentId: null, at: this.positionAfter(tile.id) ?? undefined });
  }
}
