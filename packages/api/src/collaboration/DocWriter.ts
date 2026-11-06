import { randomUUID } from "node:crypto";
import * as Y from "yjs";
import { AI_ORIGIN } from "doc/origins";
import { BODY_ID } from "doc/body";
import { getChildren, orderBetween } from "doc/placement/ordering";
import { getTileIds, insertTile, positionAfterTile, removeTiles } from "doc/richText/tiles";
import { YXmlStreamWriter } from "doc/richText/writer";
import type { SelectionRange } from "doc/richText/selection";
import type { DestinationMode } from "doc/richText/events";

export interface CreateTilePlacement {
  parentId?: string | null;
  beforeId?: string | null;
}

export interface DocWriterOptions {
  origin?: unknown;
  /** The body of a document page. Root tiles are embedded in it, after `insertAt`. */
  body?: Y.XmlFragment | null;
  insertAt?: Y.RelativePosition;
}

export class DocWriter {
  readonly body: Y.XmlFragment | null;

  private readonly doc: Y.Doc;
  private readonly origin: unknown;
  private insertAt: Y.RelativePosition | undefined;

  constructor(doc: Y.Doc, { origin = AI_ORIGIN, body = null, insertAt }: DocWriterOptions = {}) {
    this.doc = doc;
    this.origin = origin;
    this.body = body;
    this.insertAt = insertAt;
  }

  private get tiles(): Y.Map<Y.Map<unknown>> {
    return this.doc.getMap<Y.Map<unknown>>("tiles");
  }

  /**
   * Adds a tile. On a document page a root tile is embedded in the body, each one after the
   * last, starting at the insertion point or the end of the body.
   */
  createTile(map: Y.Map<unknown>, placement: CreateTilePlacement = {}): string {
    const parentId = placement.parentId ?? null;
    const id = randomUUID();
    const body = parentId === null ? this.body : null;
    this.doc.transact(() => {
      map.set("id", id);
      map.set("parentId", parentId);
      if (body) {
        this.tiles.set(id, map);
        insertTile(body, id, this.insertAt);
        this.insertAt = positionAfterTile(body, id) ?? undefined;
      } else {
        map.set("order", orderBetween(getChildren(this.tiles, parentId), placement.beforeId));
        this.tiles.set(id, map);
      }
    }, this.origin);
    return id;
  }

  /** Streams rich text into a text tile, or into the body for {@link BODY_ID}. */
  streamText(
    target: string,
    mode: DestinationMode,
    range?: SelectionRange,
  ): YXmlStreamWriter | null {
    const content = target === BODY_ID ? this.body : this.tiles.get(target)?.get("content");
    if (!(content instanceof Y.XmlFragment)) {
      return null;
    }
    if (mode === "replace" && content === this.body) {
      this.deleteTiles(getTileIds(content));
    }
    return new YXmlStreamWriter(content, mode, this.origin, range);
  }

  setProperties(tileId: string, changes: Record<string, unknown>): void {
    this.doc.transact(() => {
      const tile = this.tiles.get(tileId);
      if (!tile) {
        return;
      }
      for (const [key, value] of Object.entries(changes)) {
        tile.set(key, value);
      }
    }, this.origin);
  }

  deleteTiles(ids: string[]): void {
    this.doc.transact(() => {
      if (this.body) {
        removeTiles(this.body, ids);
      }
      for (const id of ids) {
        this.tiles.delete(id);
      }
    }, this.origin);
  }
}
