import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import Section, { type CreateSectionInput } from "@/models/Section";
import Theme from "@/models/Theme";
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

describe("Tile", () => {
  const editor = Editor.init(PAGE, new Y.Doc());

  function createTile(overrides: Partial<CreateSectionInput> = {}) {
    return editor.page.createTile(
      Section.createMap({ ...PROPS, ...overrides }),
      {},
    ) as Section;
  }

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
      expect(editor.page.doc?.getMap("themes").get(theme.id)).toEqual(
        theme.serialize(),
      );
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
});
