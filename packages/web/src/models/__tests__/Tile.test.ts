import { afterEach, describe, expect, test, vi } from "vitest";
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

  /** A fresh container with three ordered children, isolated from other tests. */
  function createFamily() {
    const parent = createTile({ layout: "VERTICAL" });
    const a = createTile({}, { parentId: parent.id });
    const b = createTile({}, { parentId: parent.id });
    const c = createTile({}, { parentId: parent.id });
    return { parent, a, b, c };
  }

  function countTransactions(run: () => void): number {
    let count = 0;
    const onTransaction = () => {
      count++;
    };
    editor.page.doc.on("afterTransaction", onTransaction);
    try {
      run();
    } finally {
      editor.page.doc.off("afterTransaction", onTransaction);
    }
    return count;
  }

  afterEach(() => {
    vi.restoreAllMocks();
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

  describe("setTheme", () => {
    test("writes the snapshot and themeId into the doc", () => {
      const tile = createTile();
      const theme = new Theme(THEME);

      tile.setTheme(theme);

      expect(tile.themeId.value).toBe(theme.id);
      expect(tile.theme.value).toEqual(theme.serialize());
      expect(editor.page.doc?.getMap("themes").get(theme.id)).toEqual(theme.serialize());
    });

    test("overwrites the snapshot on re-apply", () => {
      const tile = createTile();
      const theme = new Theme(THEME);
      tile.setTheme(theme);
      theme.name.value = "Renamed";

      tile.setTheme(theme);

      const snapshot = editor.page.doc?.getMap("themes").get(theme.id) as
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

  describe("constructor", () => {
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
      const { a, b, c } = createFamily();

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
      const { parent, a, b, c } = createFamily();
      const target = createTile({ layout: "VERTICAL" });
      const existing = createTile({}, { parentId: target.id });

      b.move({ parentId: target.id });

      expect(b.parentId.value).toBe(target.id);
      expect(ids(parent.tiles)).toEqual([a.id, c.id]);
      expect(ids(target.tiles)).toEqual([existing.id, b.id]);
      expect(b.order.value > existing.order.value).toBe(true);
    });

    test("repositions before a sibling when only beforeId is given", () => {
      const { parent, a, b, c } = createFamily();

      c.move({ beforeId: a.id });

      expect(c.parentId.value).toBe(parent.id);
      expect(ids(parent.tiles)).toEqual([c.id, a.id, b.id]);
      expect(c.order.value < a.order.value).toBe(true);
    });

    test("moves to the end when beforeId is null", () => {
      const { parent, a, b, c } = createFamily();

      a.move({ beforeId: null });

      expect(ids(parent.tiles)).toEqual([b.id, c.id, a.id]);
    });

    test("reparents before a sibling when both parentId and beforeId are given", () => {
      const { parent, a, b, c } = createFamily();
      const target = createTile({ layout: "VERTICAL" });
      const existing = createTile({}, { parentId: target.id });

      b.move({ parentId: target.id, beforeId: existing.id });

      expect(ids(parent.tiles)).toEqual([a.id, c.id]);
      expect(ids(target.tiles)).toEqual([b.id, existing.id]);
    });

    test("moves to the page root when parentId is null", () => {
      const { parent, a } = createFamily();

      a.move({ parentId: null });

      expect(a.parentId.value).toBeNull();
      expect(ids(parent.tiles)).not.toContain(a.id);
      expect(ids(editor.page.tiles)).toContain(a.id);
    });

    test("leaves placement alone when parentId is unchanged and beforeId is omitted", () => {
      const { parent, a, b, c } = createFamily();
      const order = b.order.value;

      b.move({ parentId: parent.id, x: 1 });

      expect(b.order.value).toBe(order);
      expect(ids(parent.tiles)).toEqual([a.id, b.id, c.id]);
    });

    test("writes geometry without touching placement", () => {
      const { parent, a, b, c } = createFamily();
      const order = b.order.value;

      b.move({ x: 10, y: 20, width: 30, height: 40 });

      expect(b.x.value).toBe(10);
      expect(b.y.value).toBe(20);
      expect(b.width.value).toBe(30);
      expect(b.height.value).toBe(40);
      expect(b.order.value).toBe(order);
      expect(ids(parent.tiles)).toEqual([a.id, b.id, c.id]);
    });

    test("writes a null width for page width", () => {
      const tile = createTile({ width: 11 });

      tile.move({ width: null });

      expect(tile.width.value).toBeNull();
    });

    test("leaves omitted geometry untouched", () => {
      const tile = createTile();

      tile.move({ x: 1 });

      expect(tile.x.value).toBe(1);
      expect(tile.y.value).toBe(PROPS.y);
      expect(tile.width.value).toBe(PROPS.width);
      expect(tile.height.value).toBe(PROPS.height);
      expect(tile.coordinates.value).toBeNull();
    });

    describe("coordinates", () => {
      test("sets coordinates when both lat and long are given", () => {
        const tile = createTile();

        tile.move({ lat: 51.5, long: -0.1 });

        expect(tile.coordinates.value).toEqual({ lat: 51.5, long: -0.1 });
      });

      test("merges a new lat with the existing long", () => {
        const tile = createTile();
        tile.move({ lat: 51.5, long: -0.1 });

        tile.move({ lat: 48.9 });

        expect(tile.coordinates.value).toEqual({ lat: 48.9, long: -0.1 });
      });

      test("merges a new long with the existing lat", () => {
        const tile = createTile();
        tile.move({ lat: 51.5, long: -0.1 });

        tile.move({ long: 2.3 });

        expect(tile.coordinates.value).toEqual({ lat: 51.5, long: 2.3 });
      });

      test("treats an explicit null like an omitted value", () => {
        const tile = createTile();
        tile.move({ lat: 51.5, long: -0.1 });

        tile.move({ lat: null, long: null });

        expect(tile.coordinates.value).toEqual({ lat: 51.5, long: -0.1 });
      });

      test("stays null when only one value is given and none existed", () => {
        const tile = createTile();

        tile.move({ lat: 51.5 });

        expect(tile.coordinates.value).toBeNull();
      });
    });

    test("writes placement and geometry in a single transaction", () => {
      const { a, c } = createFamily();

      const transactions = countTransactions(() =>
        c.move({ beforeId: a.id, x: 1, y: 2, width: 3, height: 4, lat: 5, long: 6 }),
      );

      expect(transactions).toBe(1);
    });
  });

  describe("moveUp", () => {
    test("swaps with the previous sibling", () => {
      const { parent, a, b, c } = createFamily();

      b.moveUp();

      expect(ids(parent.tiles)).toEqual([b.id, a.id, c.id]);
    });

    test("does nothing for the first tile", () => {
      const { parent, a, b, c } = createFamily();

      expect(countTransactions(() => a.moveUp())).toBe(0);
      expect(ids(parent.tiles)).toEqual([a.id, b.id, c.id]);
    });
  });

  describe("moveDown", () => {
    test("swaps with the next sibling", () => {
      const { parent, a, b, c } = createFamily();

      a.moveDown();

      expect(ids(parent.tiles)).toEqual([b.id, a.id, c.id]);
    });

    test("moves to the end when the next sibling is last", () => {
      const { parent, a, b, c } = createFamily();

      b.moveDown();

      expect(ids(parent.tiles)).toEqual([a.id, c.id, b.id]);
    });

    test("does nothing for the last tile", () => {
      const { parent, a, b, c } = createFamily();

      expect(countTransactions(() => c.moveDown())).toBe(0);
      expect(ids(parent.tiles)).toEqual([a.id, b.id, c.id]);
    });
  });

  describe("duplicate", () => {
    test("copies the tile with a new id into the given placement", async () => {
      const { parent, a, b, c } = createFamily();
      b.move({ x: 42, lat: 1, long: 2 });

      const copy = await b.duplicate({ parentId: parent.id, beforeId: a.id });

      expect(copy).toBeInstanceOf(Section);
      expect(copy.id).not.toBe(b.id);
      expect(copy.parentId.value).toBe(parent.id);
      expect(copy.x.value).toBe(42);
      expect(copy.coordinates.value).toEqual({ lat: 1, long: 2 });
      expect(ids(parent.tiles)).toEqual([copy.id, a.id, b.id, c.id]);
      expect(editor.page.doc.getMap("tiles").has(copy.id)).toBe(true);
    });

    test("copies children under the clone with new ids", async () => {
      const section = createTile({ layout: "VERTICAL" });
      const first = editor.page.createTile(Text.createMap({ align: "TOP" }), {
        parentId: section.id,
      });
      const second = createTile({ layout: "GRID" }, { parentId: section.id });

      const copy = (await section.duplicate({ parentId: null, beforeId: null })) as Section;

      const children = copy.tiles.value;
      expect(children).toHaveLength(2);
      expect(children.map((child) => child.type)).toEqual(["TEXT", "SECTION"]);
      expect(children.map((child) => child.id)).not.toContain(first.id);
      expect(children.map((child) => child.id)).not.toContain(second.id);
      expect(children.every((child) => child.parentId.value === copy.id)).toBe(true);
      expect(ids(section.tiles)).toEqual([first.id, second.id]);
    });
  });

  describe("delete", () => {
    test("delegates to the editor", async () => {
      const tile = createTile();
      const deleteTiles = vi.spyOn(editor, "deleteTiles").mockResolvedValue(undefined);

      await tile.delete();

      expect(deleteTiles).toHaveBeenCalledWith([tile.id]);
    });
  });

  describe("setDates", () => {
    test("writes both dates in one transaction", () => {
      const tile = createTile();

      const transactions = countTransactions(() => tile.setDates("2026-01-01", "2026-01-31"));

      expect(transactions).toBe(1);
      expect(tile.startDate.value).toBe("2026-01-01");
      expect(tile.endDate.value).toBe("2026-01-31");
    });
  });

  describe("dispose", () => {
    test("stops reacting to map changes", () => {
      const tile = createTile();
      const subscriber = vi.fn();
      tile.x.subscribe(subscriber);

      tile.dispose();
      editor.page.doc.transact(() => {
        editor.page.doc.getMap<Y.Map<unknown>>("tiles").get(tile.id)?.set("x", 99);
      });

      expect(subscriber).not.toHaveBeenCalled();
    });
  });
});
