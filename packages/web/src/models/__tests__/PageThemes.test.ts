import { beforeEach, describe, expect, test, vi } from "vitest";
import * as Y from "yjs";
import PageThemes from "@/models/PageThemes";
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

  test("apply writes the snapshot into the map", () => {
    const theme = new Theme(THEME);

    themes.apply(theme);

    expect(doc.getMap("themes").get(theme.id)).toEqual(theme.serialize());
  });

  test("re-apply overwrites the snapshot", () => {
    const theme = new Theme(THEME);
    themes.apply(theme);
    theme.colors.value = { ...theme.colors.value, text: "abababababab" };

    themes.apply(theme);

    const snapshot = doc.getMap("themes").get(theme.id) as {
      colors: { text: string };
    };
    expect(snapshot.colors.text).toBe("abababababab");
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
