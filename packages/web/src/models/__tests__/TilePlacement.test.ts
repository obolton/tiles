import * as Y from "yjs";
import { beforeEach, describe, expect, test, vi } from "vitest";
import Page from "@/models/Page";
import Section from "@/models/Section";
import Text from "@/models/Text";
import { PAGE } from "@/test/fixtures/Page";

vi.mock("@/api/client", () => ({ default: {} }));

function placeTile(
  doc: Y.Doc,
  map: Y.Map<unknown>,
  id: string,
  parentId: string | null,
  order: string,
) {
  map.set("id", id);
  map.set("parentId", parentId);
  map.set("order", order);
  doc.getMap("tiles").set(id, map);
}

describe("TilePlacement", () => {
  describe("getCollection", () => {
    let page: Page;

    beforeEach(() => {
      page = new Page(PAGE, new Y.Doc());
    });

    test("returns a stable instance per parentId", () => {
      expect(page.placement.getCollection(null)).toBe(
        page.placement.getCollection(null),
      );
      expect(page.placement.getCollection("dock:TOP")).not.toBe(
        page.placement.getCollection(null),
      );
    });

    test("section collections carry their section id, others null", () => {
      expect(page.placement.getCollection("sec-1").sectionId).toBe("sec-1");
      expect(page.placement.getCollection(null).sectionId).toBeNull();
      expect(page.placement.getCollection("dock:LEFT").sectionId).toBeNull();
    });
  });

  describe("initial placement", () => {
    test("places tiles into root, section, and dock collections", () => {
      const doc = new Y.Doc();
      placeTile(
        doc,
        Section.createMap({ layout: "VERTICAL" }),
        "sec",
        null,
        "a0",
      );
      placeTile(doc, Text.createMap({ align: "TOP" }), "root-1", null, "a1");
      placeTile(doc, Text.createMap({ align: "TOP" }), "child", "sec", "a1");
      placeTile(
        doc,
        Text.createMap({ align: "TOP" }),
        "docked",
        "dock:TOP",
        "a1",
      );
      const page = new Page(PAGE, doc);

      expect(page.tiles.value.map((t) => t.id)).toEqual(["sec", "root-1"]);
      const section = page.index.get("sec") as Section;
      expect(section.tiles.value.map((t) => t.id)).toEqual(["child"]);
      expect(page.dockedTiles.TOP.value.map((t) => t.id)).toEqual(["docked"]);
    });

    test("orders tiles within a collection by `order`", () => {
      const doc = new Y.Doc();
      placeTile(doc, Text.createMap({ align: "TOP" }), "c", null, "a3");
      placeTile(doc, Text.createMap({ align: "TOP" }), "a", null, "a1");
      placeTile(doc, Text.createMap({ align: "TOP" }), "b", null, "a2");
      const page = new Page(PAGE, doc);

      expect(page.tiles.value.map((t) => t.id)).toEqual(["a", "b", "c"]);
    });

    test("does not render tiles whose parent section is missing", () => {
      const doc = new Y.Doc();
      placeTile(doc, Text.createMap({ align: "TOP" }), "orphan", "ghost", "a1");
      const page = new Page(PAGE, doc);

      expect(page.tiles.value).toHaveLength(0);
      expect(page.placement.getCollection("ghost").value).toHaveLength(0);
      expect(page.index.has("orphan")).toBe(true);
    });

    test("places children regardless of section order in the doc map", () => {
      const doc = new Y.Doc();
      placeTile(doc, Text.createMap({ align: "TOP" }), "child", "sec", "a1");
      placeTile(
        doc,
        Section.createMap({ layout: "VERTICAL" }),
        "sec",
        null,
        "a0",
      );
      const page = new Page(PAGE, doc);

      const section = page.index.get("sec") as Section;
      expect(section.tiles.value.map((t) => t.id)).toEqual(["child"]);
    });
  });

  describe("reconcile", () => {
    let page: Page;

    beforeEach(() => {
      const doc = new Y.Doc();
      placeTile(
        doc,
        Section.createMap({ layout: "VERTICAL" }),
        "sec",
        null,
        "a0",
      );
      placeTile(doc, Text.createMap({ align: "TOP" }), "t1", null, "a1");
      placeTile(doc, Text.createMap({ align: "TOP" }), "t2", null, "a2");
      page = new Page(PAGE, doc);
    });

    function tilesMap() {
      return page.doc.getMap<Y.Map<unknown>>("tiles");
    }

    test("removes a tile when its Y.Map entry is deleted", () => {
      page.doc.transact(() => tilesMap().delete("t1"));

      expect(page.tiles.value.map((t) => t.id)).toEqual(["sec", "t2"]);
      expect(page.index.has("t1")).toBe(false);
    });

    test("moves a tile when its parentId changes", () => {
      page.doc.transact(() => tilesMap().get("t1")?.set("parentId", "sec"));

      expect(page.tiles.value.map((t) => t.id)).toEqual(["sec", "t2"]);
      const section = page.index.get("sec") as Section;
      expect(section.tiles.value.map((t) => t.id)).toEqual(["t1"]);
    });

    test("repositions a tile when its order changes", () => {
      page.doc.transact(() => tilesMap().get("t1")?.set("order", "a9"));

      expect(page.tiles.value.map((t) => t.id)).toEqual(["sec", "t2", "t1"]);
    });

    test("ignores non-placement field changes", () => {
      const before = page.tiles.value.map((t) => t.id);

      page.doc.transact(() => tilesMap().get("t1")?.set("x", 999));

      expect(page.tiles.value.map((t) => t.id)).toEqual(before);
    });

    test("drops a tile reparented onto a missing section", () => {
      page.doc.transact(() => tilesMap().get("t2")?.set("parentId", "ghost"));

      expect(page.tiles.value.map((t) => t.id)).toEqual(["sec", "t1"]);
      expect(page.placement.getCollection("ghost").value).toHaveLength(0);
    });

    test("stops reconciling after dispose", () => {
      page.placement.dispose();
      page.doc.transact(() => tilesMap().delete("t1"));

      expect(page.index.has("t1")).toBe(true);
    });

    test("constructs a sync-arriving tile from its Y.Map", () => {
      page.doc.transact(() => {
        placeTile(page.doc, Text.createMap({ align: "TOP" }), "t3", null, "a3");
      });

      expect(page.index.has("t3")).toBe(true);
      expect(page.tiles.value.map((t) => t.id)).toEqual([
        "sec",
        "t1",
        "t2",
        "t3",
      ]);
    });

    test("places a sync-arriving child under a sync-arriving section in the same batch", () => {
      page.doc.transact(() => {
        // Insert the child before the section to exercise the two-pass.
        placeTile(
          page.doc,
          Text.createMap({ align: "TOP" }),
          "child",
          "new-sec",
          "a1",
        );
        placeTile(
          page.doc,
          Section.createMap({ layout: "VERTICAL" }),
          "new-sec",
          null,
          "a3",
        );
      });

      const newSection = page.index.get("new-sec") as Section;
      expect(newSection.tiles.value.map((t) => t.id)).toEqual(["child"]);
    });
  });

  describe("tile.move", () => {
    let page: Page;

    beforeEach(() => {
      const doc = new Y.Doc();
      placeTile(
        doc,
        Section.createMap({ layout: "VERTICAL" }),
        "sec",
        null,
        "a0",
      );
      placeTile(doc, Text.createMap({ align: "TOP" }), "t1", null, "a1");
      placeTile(doc, Text.createMap({ align: "TOP" }), "t2", null, "a2");
      placeTile(doc, Text.createMap({ align: "TOP" }), "t3", null, "a3");
      page = new Page(PAGE, doc);
    });

    test("reparents a tile into a section", () => {
      page.getTile("t1").move({ parentId: "sec" });

      expect(page.tiles.value.map((t) => t.id)).toEqual(["sec", "t2", "t3"]);
      expect(page.getSection("sec").tiles.value.map((t) => t.id)).toEqual([
        "t1",
      ]);
    });

    test("reorders before a sibling via beforeId", () => {
      page.getTile("t3").move({ beforeId: "t1" });

      expect(page.tiles.value.map((t) => t.id)).toEqual([
        "sec",
        "t3",
        "t1",
        "t2",
      ]);
    });

    test("appends to the end when beforeId is null", () => {
      page.getTile("t1").move({ beforeId: null });

      expect(page.tiles.value.map((t) => t.id)).toEqual([
        "sec",
        "t2",
        "t3",
        "t1",
      ]);
    });

    test("moveUp swaps with the previous sibling", () => {
      page.getTile("t3").moveUp();

      expect(page.tiles.value.map((t) => t.id)).toEqual([
        "sec",
        "t1",
        "t3",
        "t2",
      ]);
    });

    test("moveDown swaps with the next sibling", () => {
      page.getTile("t1").moveDown();

      expect(page.tiles.value.map((t) => t.id)).toEqual([
        "sec",
        "t2",
        "t1",
        "t3",
      ]);
    });
  });
});
