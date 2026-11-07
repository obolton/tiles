import { beforeEach, describe, expect, test, vi } from "vitest";
import * as Y from "yjs";
import PageThemes, { THEME_EDIT_ORIGIN } from "@/models/PageThemes";
import Theme from "@/models/Theme";
import { THEME, DARK_THEME } from "@/test/fixtures/Theme";

describe("PageThemes", () => {
  let doc: Y.Doc;
  let themes: PageThemes;

  beforeEach(() => {
    doc = new Y.Doc();
    themes = new PageThemes(doc);
  });

  test("value is the themes Y.Map", () => {
    expect(themes.value).toBe(doc.getMap("themes"));
  });

  describe("apply", () => {
    test("writes the snapshot into the map", () => {
      const theme = new Theme(THEME);

      themes.apply(theme);

      expect(doc.getMap("themes").get(theme.id)).toEqual(theme.serialize());
    });

    test("overwrites the snapshot on re-apply", () => {
      const theme = new Theme(THEME);
      themes.apply(theme);
      theme.data.value = { ...theme.data.value, name: "Renamed" };

      themes.apply(theme);

      expect(doc.getMap("themes").get(theme.id)).toMatchObject({ name: "Renamed" });
    });
  });

  describe("refresh", () => {
    test("updates the snapshot of a theme the page uses", () => {
      const theme = new Theme(THEME);
      themes.apply(theme);
      theme.data.value = { ...theme.data.value, name: "Renamed" };

      themes.refresh(theme);

      expect(doc.getMap("themes").get(theme.id)).toMatchObject({ name: "Renamed" });
    });

    test("ignores a theme the page does not use", () => {
      themes.refresh(new Theme(THEME));

      expect(doc.getMap("themes").has(THEME.id)).toBe(false);
    });

    test("writes with the theme edit origin", () => {
      const origins: unknown[] = [];
      doc.on("afterTransaction", (transaction) => origins.push(transaction.origin));
      const theme = new Theme(THEME);
      themes.apply(theme);

      themes.refresh(theme);

      expect(origins.at(-1)).toBe(THEME_EDIT_ORIGIN);
    });
  });

  describe("delete", () => {
    test("removes the snapshot", () => {
      const theme = new Theme(THEME);
      themes.apply(theme);

      themes.delete(theme.id);

      expect(doc.getMap("themes").has(theme.id)).toBe(false);
    });
  });

  test("notifies subscribers on entry change", () => {
    const listener = vi.fn();
    themes.subscribe(listener);

    themes.apply(new Theme(THEME));
    themes.apply(new Theme(DARK_THEME));

    expect(listener).toHaveBeenCalledTimes(2);
  });

  test("dispose stops notifications", () => {
    const listener = vi.fn();
    themes.subscribe(listener);

    themes.dispose();
    themes.apply(new Theme(THEME));

    expect(listener).not.toHaveBeenCalled();
  });
});
