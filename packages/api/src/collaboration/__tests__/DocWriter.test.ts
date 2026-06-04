import { beforeEach, describe, expect, test } from "vitest";
import * as Y from "yjs";
import { AI_ORIGIN } from "doc/origins";
import { buildSectionMap } from "doc/tiles/section";
import { buildTextMap } from "doc/tiles/text";
import { DocWriter } from "@/collaboration/DocWriter";

describe("DocWriter", () => {
  let doc: Y.Doc;
  let writer: DocWriter;
  let tiles: Y.Map<Y.Map<unknown>>;

  beforeEach(() => {
    doc = new Y.Doc();
    writer = new DocWriter(doc);
    tiles = doc.getMap<Y.Map<unknown>>("tiles");
  });

  describe("createTile", () => {
    test("inserts the map with id/parentId/order and preserves fields", () => {
      const id = writer.createTile(buildSectionMap({ layout: "GRID" }));

      const tile = tiles.get(id);
      expect(tile).toBeInstanceOf(Y.Map);
      expect(tile?.get("id")).toBe(id);
      expect(tile?.get("parentId")).toBeNull();
      expect(typeof tile?.get("order")).toBe("string");
      expect(tile?.get("type")).toBe("SECTION");
      expect(tile?.get("layout")).toBe("GRID");
    });

    test("appends after existing siblings by default", () => {
      const first = writer.createTile(buildTextMap({}));
      const second = writer.createTile(buildTextMap({}));

      const firstOrder = tiles.get(first)?.get("order") as string;
      const secondOrder = tiles.get(second)?.get("order") as string;
      expect(secondOrder > firstOrder).toBe(true);
    });

    test("places before beforeId", () => {
      const first = writer.createTile(buildTextMap({}));
      const second = writer.createTile(buildTextMap({}), { beforeId: first });

      const firstOrder = tiles.get(first)?.get("order") as string;
      const secondOrder = tiles.get(second)?.get("order") as string;
      expect(secondOrder < firstOrder).toBe(true);
    });

    test("orders within the given parent, independent of the root", () => {
      const section = writer.createTile(buildSectionMap({}));
      const childA = writer.createTile(buildTextMap({}), { parentId: section });
      const childB = writer.createTile(buildTextMap({}), { parentId: section });

      expect(tiles.get(childA)?.get("parentId")).toBe(section);
      expect(tiles.get(childB)?.get("parentId")).toBe(section);

      const orderA = tiles.get(childA)?.get("order") as string;
      const orderB = tiles.get(childB)?.get("order") as string;
      expect(orderB > orderA).toBe(true);
    });
  });

  describe("setProperties", () => {
    test("updates doc-shaped fields on an existing tile", () => {
      const id = writer.createTile(buildSectionMap({ layout: "VERTICAL" }));

      writer.setProperties(id, { layout: "GRID", columns: 3 });

      expect(tiles.get(id)?.get("layout")).toBe("GRID");
      expect(tiles.get(id)?.get("columns")).toBe(3);
    });

    test("is a no-op for a missing tile", () => {
      expect(() => writer.setProperties("missing", { x: 1 })).not.toThrow();
      expect(tiles.has("missing")).toBe(false);
    });
  });

  describe("deleteTiles", () => {
    test("removes the named tiles and leaves the rest", () => {
      const a = writer.createTile(buildTextMap({}));
      const b = writer.createTile(buildTextMap({}));

      writer.deleteTiles([a]);

      expect(tiles.has(a)).toBe(false);
      expect(tiles.has(b)).toBe(true);
    });
  });

  describe("origin", () => {
    test("tags writes with AI_ORIGIN by default and never origin null", () => {
      const origins: unknown[] = [];
      doc.on("afterTransaction", (transaction) => {
        origins.push(transaction.origin);
      });

      writer.createTile(buildTextMap({}));

      expect(origins).toContain(AI_ORIGIN);
      expect(origins).not.toContain(null);
    });

    test("uses a custom origin when provided", () => {
      const custom = Symbol("custom");
      const customWriter = new DocWriter(doc, custom);
      const origins: unknown[] = [];
      doc.on("afterTransaction", (transaction) => {
        origins.push(transaction.origin);
      });

      customWriter.createTile(buildTextMap({}));

      expect(origins).toContain(custom);
    });
  });
});
