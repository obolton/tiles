import { beforeEach, describe, expect, test } from "vitest";
import * as Y from "yjs";
import { AI_ORIGIN } from "doc/origins";
import { BODY_ID, getBody } from "doc/body";
import { getTileIds } from "doc/richText/tiles";
import { buildImageMap } from "doc/tiles/image";
import { buildSectionMap } from "doc/tiles/section";
import { buildTextMap } from "doc/tiles/text";
import { DocWriter } from "@/collaboration/DocWriter";

const IMAGE = { imageId: "image-id", size: { width: 10, height: 10 } };

function paragraph(text: string): Y.XmlElement {
  const content = new Y.XmlText();
  content.insert(0, text);
  const element = new Y.XmlElement("paragraph");
  element.insert(0, [content]);
  return element;
}

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
      const customWriter = new DocWriter(doc, { origin: custom });
      const origins: unknown[] = [];
      doc.on("afterTransaction", (transaction) => {
        origins.push(transaction.origin);
      });

      customWriter.createTile(buildTextMap({}));

      expect(origins).toContain(custom);
    });
  });

  describe("document body", () => {
    let body: Y.XmlFragment;
    let bodyWriter: DocWriter;

    function outline(): string[] {
      return body
        .toArray()
        .map((node) =>
          node instanceof Y.XmlElement && node.nodeName === "tile"
            ? `tile:${node.getAttribute("id")}`
            : "paragraph",
        );
    }

    beforeEach(() => {
      body = getBody(doc);
      body.insert(0, [paragraph("Intro")]);
      bodyWriter = new DocWriter(doc, { body });
    });

    test("embeds root tiles in the body in order without an order key", () => {
      const first = bodyWriter.createTile(buildImageMap(IMAGE));
      const second = bodyWriter.createTile(buildImageMap(IMAGE));

      expect(tiles.get(first)?.get("parentId")).toBeNull();
      expect(tiles.get(first)?.has("order")).toBe(false);
      expect(getTileIds(body)).toEqual([first, second]);
      expect(outline()).toEqual(["paragraph", `tile:${first}`, `tile:${second}`, "paragraph"]);
    });

    test("inserts after the block at the insertion point, then after each tile", () => {
      body.insert(1, [paragraph("Outro")]);
      const intro = body.get(0) as Y.XmlElement;
      const insertAt = Y.createRelativePositionFromTypeIndex(intro.firstChild as Y.XmlText, 1);
      const writer = new DocWriter(doc, { body, insertAt });

      const first = writer.createTile(buildImageMap(IMAGE));
      const second = writer.createTile(buildImageMap(IMAGE));

      expect(outline()).toEqual(["paragraph", `tile:${first}`, `tile:${second}`, "paragraph"]);
    });

    test("still orders tiles inside sections", () => {
      const section = bodyWriter.createTile(buildSectionMap({}));
      const child = bodyWriter.createTile(buildTextMap({}), { parentId: section });

      expect(tiles.get(child)?.get("parentId")).toBe(section);
      expect(typeof tiles.get(child)?.get("order")).toBe("string");
      expect(getTileIds(body)).toEqual([section]);
    });

    test("streams text into the body", () => {
      const stream = bodyWriter.streamText(BODY_ID, "append");
      stream?.apply({ type: "paragraph" });
      stream?.apply("Appended");

      expect(body).toHaveLength(2);
      expect(outline()).toEqual(["paragraph", "paragraph"]);
    });

    test("deletes the maps of embedded tiles when replacing the body", () => {
      const image = bodyWriter.createTile(buildImageMap(IMAGE));

      bodyWriter.streamText(BODY_ID, "replace");

      expect(body).toHaveLength(0);
      expect(tiles.has(image)).toBe(false);
    });

    test("removes an embedded tile's node with its map", () => {
      const image = bodyWriter.createTile(buildImageMap(IMAGE));

      bodyWriter.deleteTiles([image]);

      expect(tiles.has(image)).toBe(false);
      expect(getTileIds(body)).toEqual([]);
    });
  });
});
