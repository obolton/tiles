import { beforeEach, describe, expect, test, vi } from "vitest";
import * as Y from "yjs";
import Page from "@/models/Page";
import Section, { type CreateSectionInput } from "@/models/Section";
import Text from "@/models/Text";
import Theme from "@/models/Theme";
import type TileCollection from "@/models/TileCollection";
import Editor from "@/editor/Editor";
import { ASPECT_RATIOS } from "@/constants/size";
import { PAGE } from "@/test/fixtures/Page";
import { THEME } from "@/test/fixtures/Theme";

// Tile is abstract; exercise its base behavior via Section.
const PROPS: CreateSectionInput = {
  layout: "VERTICAL",
  sizing: "CUSTOM",
  x: 5,
  y: 7,
  width: 11,
  height: 13,
  rowSpan: 2,
  hide: false,
  animation: "FADE",
};

function ids(collection: TileCollection): string[] {
  return collection.value.map((tile) => tile.id);
}

describe("Tile", () => {
  const editor = Editor.init(PAGE, new Y.Doc());

  function createTile(
    overrides: Partial<CreateSectionInput> = {},
    placement: { parentId?: string | null; beforeId?: string | null } = {},
  ) {
    return editor.page.createTile(
      Section.createMap({ ...PROPS, ...overrides }),
      placement,
    ) as Section;
  }

  // A fresh section with three ordered children, isolated from other tests.
  let section: Section;
  let a: Section;
  let b: Section;
  let c: Section;

  beforeEach(() => {
    section = createTile({ layout: "VERTICAL" });
    a = createTile({}, { parentId: section.id });
    b = createTile({}, { parentId: section.id });
    c = createTile({}, { parentId: section.id });
  });

  test("maps properties to reactive values", () => {
    const tile = createTile();

    expect(tile.page).toBe(editor.page);
    expect(tile.sizing.value).toBe(PROPS.sizing);
    expect(tile.x.value).toBe(PROPS.x);
    expect(tile.y.value).toBe(PROPS.y);
    expect(tile.width.value).toBe(PROPS.width);
    expect(tile.height.value).toBe(PROPS.height);
    expect(tile.rowSpan.value).toBe(PROPS.rowSpan);
    expect(tile.animation.value).toBe(PROPS.animation);
    expect(tile.hide.value).toBe(PROPS.hide);
  });

  describe("constructor", () => {
    // A detached Y.Map cannot be read, so attach each map to a scratch doc.
    test("throws when the map has no id", () => {
      const map = Section.createMap(PROPS);
      new Y.Doc().getMap("tiles").set("no-id", map);

      expect(() => new Section(editor.page, map)).toThrow("Missing ID");
    });

    test("throws when the map has no type", () => {
      const map = Section.createMap(PROPS);
      map.set("id", "no-type");
      new Y.Doc().getMap("tiles").set("no-type", map);
      map.delete("type");

      expect(() => new Section(editor.page, map)).toThrow("Missing type");
    });
  });

  describe("editor", () => {
    test("throws without an editor context", () => {
      const page = new Page(PAGE, new Y.Doc());
      const tile = page.createTile(Section.createMap(PROPS), {});

      expect(() => tile.editor).toThrow("Requires editor context");
    });
  });

  describe("index, previous and next", () => {
    test("reflect the tile's position among its siblings", () => {
      expect(a.index).toBe(0);
      expect(a.previous).toBeNull();
      expect(a.next).toBe(b);
      expect(b.index).toBe(1);
      expect(b.previous).toBe(a);
      expect(b.next).toBe(c);
      expect(c.index).toBe(2);
      expect(c.previous).toBe(b);
      expect(c.next).toBeNull();
    });

    test("are null for a tile that is not in a collection", () => {
      const orphan = createTile({}, { parentId: "missing-section" });

      expect(orphan.parent).toBeNull();
      expect(orphan.index).toBeNull();
      expect(orphan.previous).toBeNull();
      expect(orphan.next).toBeNull();
    });
  });

  describe("move", () => {
    test("appends to the target parent when only parentId is given", () => {
      const target = createTile({ layout: "VERTICAL" });
      const existing = createTile({}, { parentId: target.id });

      b.move({ parentId: target.id });

      expect(b.parentId.value).toBe(target.id);
      expect(ids(section.tiles)).toEqual([a.id, c.id]);
      expect(ids(target.tiles)).toEqual([existing.id, b.id]);
    });

    test("repositions before a sibling when only beforeId is given", () => {
      c.move({ beforeId: a.id });

      expect(c.parentId.value).toBe(section.id);
      expect(ids(section.tiles)).toEqual([c.id, a.id, b.id]);
    });

    test("moves to the end when beforeId is null", () => {
      a.move({ beforeId: null });

      expect(ids(section.tiles)).toEqual([b.id, c.id, a.id]);
    });

    test("reparents before a sibling when both parentId and beforeId are given", () => {
      const target = createTile({ layout: "VERTICAL" });
      const existing = createTile({}, { parentId: target.id });

      b.move({ parentId: target.id, beforeId: existing.id });

      expect(ids(section.tiles)).toEqual([a.id, c.id]);
      expect(ids(target.tiles)).toEqual([b.id, existing.id]);
    });

    test("moves to the page root when parentId is null", () => {
      a.move({ parentId: null });

      expect(a.parentId.value).toBeNull();
      expect(ids(section.tiles)).toEqual([b.id, c.id]);
      expect(ids(editor.page.tiles)).toContain(a.id);
    });

    test("leaves placement alone when parentId is unchanged and beforeId is omitted", () => {
      const order = b.order.value;

      b.move({ parentId: section.id, x: 1 });

      expect(b.order.value).toBe(order);
      expect(ids(section.tiles)).toEqual([a.id, b.id, c.id]);
    });

    test("writes geometry without touching placement", () => {
      const order = b.order.value;

      b.move({ x: 10, y: 20, width: 30, height: 40 });

      expect(b.x.value).toBe(10);
      expect(b.y.value).toBe(20);
      expect(b.width.value).toBe(30);
      expect(b.height.value).toBe(40);
      expect(b.order.value).toBe(order);
      expect(ids(section.tiles)).toEqual([a.id, b.id, c.id]);
    });

    test("writes a null width for page width", () => {
      a.move({ width: null });

      expect(a.width.value).toBeNull();
    });

    test("leaves omitted geometry untouched", () => {
      a.move({ x: 1 });

      expect(a.x.value).toBe(1);
      expect(a.y.value).toBe(PROPS.y);
      expect(a.width.value).toBe(PROPS.width);
      expect(a.height.value).toBe(PROPS.height);
      expect(a.coordinates.value).toBeNull();
    });

    describe("coordinates", () => {
      test("sets coordinates when both lat and long are given", () => {
        a.move({ lat: 51.5, long: -0.1 });

        expect(a.coordinates.value).toEqual({ lat: 51.5, long: -0.1 });
      });

      test("merges a new lat with the existing long", () => {
        a.move({ lat: 51.5, long: -0.1 });

        a.move({ lat: 48.9 });

        expect(a.coordinates.value).toEqual({ lat: 48.9, long: -0.1 });
      });

      test("merges a new long with the existing lat", () => {
        a.move({ lat: 51.5, long: -0.1 });

        a.move({ long: 2.3 });

        expect(a.coordinates.value).toEqual({ lat: 51.5, long: 2.3 });
      });

      test("treats an explicit null like an omitted value", () => {
        a.move({ lat: 51.5, long: -0.1 });

        a.move({ lat: null, long: null });

        expect(a.coordinates.value).toEqual({ lat: 51.5, long: -0.1 });
      });

      test("stays null when only one value is given and none existed", () => {
        a.move({ lat: 51.5 });

        expect(a.coordinates.value).toBeNull();
      });
    });
  });

  describe("moveUp", () => {
    test("swaps with the previous sibling", () => {
      b.moveUp();

      expect(ids(section.tiles)).toEqual([b.id, a.id, c.id]);
    });

    test("does nothing for the first tile", () => {
      a.moveUp();

      expect(ids(section.tiles)).toEqual([a.id, b.id, c.id]);
    });
  });

  describe("moveDown", () => {
    test("swaps with the next sibling", () => {
      a.moveDown();

      expect(ids(section.tiles)).toEqual([b.id, a.id, c.id]);
    });

    test("moves to the end when the next sibling is last", () => {
      b.moveDown();

      expect(ids(section.tiles)).toEqual([a.id, c.id, b.id]);
    });

    test("does nothing for the last tile", () => {
      c.moveDown();

      expect(ids(section.tiles)).toEqual([a.id, b.id, c.id]);
    });
  });

  describe("duplicate", () => {
    test("copies the tile with a new id into the given placement", async () => {
      b.move({ x: 42, lat: 1, long: 2 });

      const copy = await b.duplicate({ parentId: section.id, beforeId: a.id });

      expect(copy).toBeInstanceOf(Section);
      expect(copy.id).not.toBe(b.id);
      expect(copy.parentId.value).toBe(section.id);
      expect(copy.x.value).toBe(42);
      expect(copy.coordinates.value).toEqual({ lat: 1, long: 2 });
      expect(ids(section.tiles)).toEqual([copy.id, a.id, b.id, c.id]);
    });

    test("copies children under the clone with new ids", async () => {
      const text = editor.page.createTile(Text.createMap({ align: "TOP" }), {
        parentId: a.id,
      });

      const copy = (await a.duplicate({ parentId: null, beforeId: null })) as Section;

      const [child] = copy.tiles.value;
      expect(copy.tiles.value).toHaveLength(1);
      expect(child?.type).toBe("TEXT");
      expect(child?.id).not.toBe(text.id);
      expect(child?.parentId.value).toBe(copy.id);
      expect(ids(a.tiles)).toEqual([text.id]);
    });
  });

  describe("delete", () => {
    test("delegates to the editor", async () => {
      const deleteTiles = vi.spyOn(editor, "deleteTiles").mockResolvedValue();

      await a.delete();

      expect(deleteTiles).toHaveBeenCalledWith([a.id]);
      deleteTiles.mockRestore();
    });
  });

  describe("setSizing", () => {
    test("sets landscape sizing and computes height from aspect ratio", () => {
      const tile = createTile({ width: 11 });
      const expectedHeight = Math.round(11 / ASPECT_RATIOS.LANDSCAPE);

      tile.setSizing("LANDSCAPE");

      expect(tile.sizing.value).toBe("LANDSCAPE");
      expect(tile.width.value).toBe(PROPS.width);
      expect(tile.height.value).toBe(expectedHeight);
    });

    test("sets square sizing", () => {
      const tile = createTile();

      tile.setSizing("SQUARE");

      expect(tile.sizing.value).toBe("SQUARE");
      expect(tile.width.value).toBe(PROPS.width);
      expect(tile.height.value).toBe(PROPS.width);
    });

    test("uses page width when tile width is null", () => {
      const tile = createTile({ width: null });
      const pageWidth = editor.page.width.value;
      const expectedHeight = Math.round(pageWidth / ASPECT_RATIOS.LANDSCAPE);

      tile.setSizing("LANDSCAPE");

      expect(tile.height.value).toBe(expectedHeight);
    });

    test("sets auto sizing without recomputing height", () => {
      const tile = createTile();
      const originalHeight = tile.height.value;

      tile.setSizing("AUTO");

      expect(tile.sizing.value).toBe("AUTO");
      expect(tile.height.value).toBe(originalHeight);
    });
  });

  describe("setSize", () => {
    test("updates the size", () => {
      const tile = createTile();
      const width = 99;
      const height = 101;

      tile.setSize({ width, height });

      expect(tile.width.value).toBe(width);
      expect(tile.height.value).toBe(height);
    });

    test("sets width to null for page width", () => {
      const tile = createTile();

      tile.setSize({ width: null });

      expect(tile.width.value).toBeNull();
    });
  });

  describe("setDates", () => {
    test("updates the dates", () => {
      const tile = createTile();

      tile.setDates("2026-01-01", "2026-01-31");

      expect(tile.startDate.value).toBe("2026-01-01");
      expect(tile.endDate.value).toBe("2026-01-31");
    });
  });

  describe("setTheme", () => {
    test("writes the snapshot and themeId into the doc", () => {
      const tile = createTile();
      const theme = new Theme(THEME);

      tile.setTheme(theme);

      expect(tile.themeId.value).toBe(theme.id);
      expect(tile.theme.value).toEqual(theme.serialize());
      expect(editor.page.doc.getMap("themes").get(theme.id)).toEqual(theme.serialize());
    });

    test("overwrites the snapshot on re-apply", () => {
      const tile = createTile();
      const theme = new Theme(THEME);
      tile.setTheme(theme);
      theme.name.value = "Renamed";

      tile.setTheme(theme);

      const snapshot = editor.page.doc.getMap("themes").get(theme.id) as
        | { name: string }
        | undefined;
      expect(snapshot?.name).toBe("Renamed");
    });

    test("clears the theme", () => {
      const tile = createTile();
      const theme = new Theme(THEME);
      tile.setTheme(theme);

      tile.setTheme(null);

      expect(tile.themeId.value).toBeNull();
      expect(tile.theme.value).toBeNull();
    });
  });
});
