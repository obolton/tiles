import * as Y from "yjs";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import Editor from "@/editor/Editor";
import Section from "@/models/Section";
import { PAGE } from "@/test/fixtures/Page";
import { TILE, SECTION_TILE } from "@/test/fixtures/Tile";

vi.mock("@/api/client", () => ({ default: {} }));

// Hocuspocus would open a real WebSocket on construction; stub it. The Y.Doc
// PageCollaboration creates is independent of the provider, so it stays real.
vi.mock("@hocuspocus/provider", () => ({
  WebSocketStatus: { Connecting: "connecting" },
  HocuspocusProvider: class {
    awareness = null;
    destroy() {}
  },
}));

describe("TilePlacement", () => {
  let editor: Editor;
  let doc: Y.Doc;

  beforeAll(() => {
    // Exercise the real collaboration wiring rather than the SSR no-op path.
    vi.stubEnv("SSR", false);
    vi.stubEnv("PUBLIC_COLLABORATION_URL", "ws://test");
    editor = Editor.init(PAGE);
    doc = editor.page.doc!;
  });

  afterAll(() => {
    editor.page.placement.dispose();
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    editor.page.placement.dispose();
    editor.page.index.clear();
    doc.transact(() => doc.getMap("tiles").clear());
  });

  describe("getCollection", () => {
    test("returns a stable instance per parentId", () => {
      expect(editor.page.placement.getCollection(null)).toBe(
        editor.page.placement.getCollection(null),
      );
      expect(editor.page.placement.getCollection("dock:TOP")).not.toBe(
        editor.page.placement.getCollection(null),
      );
    });

    test("section collections carry their section id, others null", () => {
      expect(editor.page.placement.getCollection("sec-1").sectionId).toBe(
        "sec-1",
      );
      expect(editor.page.placement.getCollection(null).sectionId).toBeNull();
      expect(
        editor.page.placement.getCollection("dock:LEFT").sectionId,
      ).toBeNull();
    });
  });

  describe("bootstrap", () => {
    test("places tiles into root, section, and dock collections", () => {
      editor.page.placement.bootstrap([
        { ...SECTION_TILE, id: "sec", sectionId: null },
        { ...TILE, id: "root-1", sectionId: null, dock: null },
        { ...TILE, id: "child", sectionId: "sec", dock: null },
        { ...TILE, id: "docked", sectionId: null, dock: "TOP" },
      ]);

      expect(editor.page.tiles.value.map((t) => t.id)).toEqual([
        "sec",
        "root-1",
      ]);
      const section = editor.page.index.get("sec") as Section;
      expect(section.tiles.value.map((t) => t.id)).toEqual(["child"]);
      expect(editor.page.dockedTiles.TOP.value.map((t) => t.id)).toEqual([
        "docked",
      ]);
    });

    test("orders tiles within a collection by `order`", () => {
      editor.page.placement.bootstrap([
        { ...TILE, id: "c", sectionId: null, order: "a3" },
        { ...TILE, id: "a", sectionId: null, order: "a1" },
        { ...TILE, id: "b", sectionId: null, order: "a2" },
      ]);

      expect(editor.page.tiles.value.map((t) => t.id)).toEqual(["a", "b", "c"]);
    });

    test("does not render tiles whose parent section is missing", () => {
      editor.page.placement.bootstrap([
        { ...TILE, id: "orphan", sectionId: "ghost", dock: null },
      ]);

      expect(editor.page.tiles.value).toHaveLength(0);
      expect(editor.page.placement.getCollection("ghost").value).toHaveLength(
        0,
      );
      // Still constructed/indexed, just not placed.
      expect(editor.page.index.has("orphan")).toBe(true);
    });

    test("places children regardless of section order in the list", () => {
      editor.page.placement.bootstrap([
        { ...TILE, id: "child", sectionId: "sec", dock: null },
        { ...SECTION_TILE, id: "sec", sectionId: null },
      ]);

      const section = editor.page.index.get("sec") as Section;
      expect(section.tiles.value.map((t) => t.id)).toEqual(["child"]);
    });
  });

  describe("reconcile", () => {
    function tilesMap() {
      return doc.getMap<Y.Map<unknown>>("tiles");
    }

    beforeEach(() => {
      editor.page.placement.bootstrap([
        { ...SECTION_TILE, id: "sec", sectionId: null },
        { ...TILE, id: "t1", sectionId: null, order: "a1" },
        { ...TILE, id: "t2", sectionId: null, order: "a2" },
      ]);
    });

    test("removes a tile when its Y.Map entry is deleted", () => {
      doc.transact(() => tilesMap().delete("t1"));

      expect(editor.page.tiles.value.map((t) => t.id)).toEqual(["sec", "t2"]);
      expect(editor.page.index.has("t1")).toBe(false);
    });

    test("moves a tile when its parentId changes", () => {
      doc.transact(() => tilesMap().get("t1")?.set("parentId", "sec"));

      expect(editor.page.tiles.value.map((t) => t.id)).toEqual(["sec", "t2"]);
      const section = editor.page.index.get("sec") as Section;
      expect(section.tiles.value.map((t) => t.id)).toEqual(["t1"]);
    });

    test("repositions a tile when its order changes", () => {
      doc.transact(() => tilesMap().get("t1")?.set("order", "a9"));

      expect(editor.page.tiles.value.map((t) => t.id)).toEqual([
        "sec",
        "t2",
        "t1",
      ]);
    });

    test("ignores non-placement field changes", () => {
      const before = editor.page.tiles.value.map((t) => t.id);
      doc.transact(() => tilesMap().get("t1")?.set("x", 999));

      expect(editor.page.tiles.value.map((t) => t.id)).toEqual(before);
    });

    test("drops a tile reparented onto a missing section", () => {
      doc.transact(() => tilesMap().get("t2")?.set("parentId", "ghost"));

      expect(editor.page.tiles.value.map((t) => t.id)).toEqual(["sec", "t1"]);
      expect(editor.page.placement.getCollection("ghost").value).toHaveLength(
        0,
      );
    });

    test("stops reconciling after dispose", () => {
      editor.page.placement.dispose();
      doc.transact(() => tilesMap().delete("t1"));

      expect(editor.page.index.has("t1")).toBe(true);
    });
  });
});
