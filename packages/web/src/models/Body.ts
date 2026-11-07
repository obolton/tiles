import type * as Y from "yjs";
import { reactive, type Reactive } from "reactivity";
import { getBody } from "doc/body";
import { insertTile, positionAfterTile, removeTiles } from "doc/richText/tiles";
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

  /** Where the body editor embeds a tile: the slot after the block holding the caret. */
  readonly insertionPoint: Reactive<Y.RelativePosition | null> = reactive(null);

  constructor(page: Page) {
    this.page = page;
    this.fragment = getBody(page.doc);
  }

  private get tilesMap(): Y.Map<Y.Map<unknown>> {
    return this.page.doc.getMap<Y.Map<unknown>>("tiles");
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

  placementAfter(tile: Tile): TilePlacementInput {
    return { parentId: null, at: this.positionAfter(tile.id) ?? undefined };
  }

  duplicate(tile: Tile): Tile {
    return tile.clone(this.placementAfter(tile));
  }
}
