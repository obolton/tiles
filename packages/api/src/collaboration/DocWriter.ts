import { randomUUID } from "node:crypto";
import * as Y from "yjs";
import { AI_ORIGIN } from "doc/origins";
import { getChildren, orderBetween } from "doc/placement/ordering";
import { YXmlStreamWriter } from "doc/richText/writer";
import type { DestinationMode } from "doc/richText/events";

export interface CreateTilePlacement {
  parentId?: string | null;
  beforeId?: string | null;
}

export class DocWriter {
  constructor(
    private readonly doc: Y.Doc,
    private readonly origin: unknown = AI_ORIGIN,
  ) {}

  private get tiles(): Y.Map<Y.Map<unknown>> {
    return this.doc.getMap<Y.Map<unknown>>("tiles");
  }

  createTile(map: Y.Map<unknown>, placement: CreateTilePlacement = {}): string {
    const parentId = placement.parentId ?? null;
    const id = randomUUID();
    this.doc.transact(() => {
      const order = orderBetween(
        getChildren(this.tiles, parentId),
        placement.beforeId,
      );
      map.set("id", id);
      map.set("parentId", parentId);
      map.set("order", order);
      this.tiles.set(id, map);
    }, this.origin);
    return id;
  }

  streamText(tileId: string, mode: DestinationMode): YXmlStreamWriter | null {
    const content = this.tiles.get(tileId)?.get("content");
    if (!(content instanceof Y.XmlFragment)) {
      return null;
    }
    return new YXmlStreamWriter(content, mode, this.origin);
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
      for (const id of ids) {
        this.tiles.delete(id);
      }
    }, this.origin);
  }
}
