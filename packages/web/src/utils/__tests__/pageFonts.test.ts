import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import { prosemirrorToYXmlFragment } from "y-prosemirror";
import { getBody } from "doc/body";
import { getPageFonts, getPagePreloads } from "../pageFonts";
import Text from "@/models/Text";
import Image from "@/models/Image";
import { deserialize } from "@/utils/richText/deserialize";
import { THEME } from "@/test/fixtures/Theme";
import type { Theme } from "api/types/themes";
import type { RichText } from "doc/types/richText";

function createDoc(themes: Theme[] = [], pageThemeId?: string): Y.Doc {
  const doc = new Y.Doc();
  const themesMap = doc.getMap("themes");
  for (const theme of themes) {
    themesMap.set(theme.id, theme);
  }
  if (pageThemeId) {
    doc.getMap("metadata").set("themeId", pageThemeId);
  }
  return doc;
}

function addTile(doc: Y.Doc, id: string, map: Y.Map<unknown>): void {
  map.set("id", id);
  doc.getMap<Y.Map<unknown>>("tiles").set(id, map);
}

function addTextTile(doc: Y.Doc, id: string, content: RichText): void {
  const map = Text.createMap({});
  addTile(doc, id, map);
  prosemirrorToYXmlFragment(deserialize(content), map.get("content") as Y.XmlFragment);
}

function fontParagraph(font: string): RichText {
  return [
    {
      type: "paragraph",
      align: 0,
      children: [{ type: "text", text: "Hi", format: 0, font }],
    },
  ];
}

describe("getPageFonts", () => {
  test("returns an empty set for a bare page", () => {
    expect(getPageFonts(createDoc())).toEqual(new Set());
  });

  test("includes the page font override", () => {
    const doc = createDoc();
    doc.getMap("metadata").set("font", "lora");
    expect(getPageFonts(doc)).toEqual(new Set(["lora"]));
  });

  test("includes all three fonts of a theme snapshot", () => {
    expect(getPageFonts(createDoc([THEME]))).toEqual(new Set(["lora", "inter", "jetbrains-mono"]));
  });

  test("merges fonts across multiple theme snapshots", () => {
    const other: Theme = {
      ...THEME,
      id: "other-theme",
      fonts: { heading: "quicksand", body: "quicksand", code: "dynapuff" },
    };
    expect(getPageFonts(createDoc([THEME, other]))).toEqual(
      new Set(["lora", "inter", "jetbrains-mono", "quicksand", "dynapuff"]),
    );
  });

  test("includes fonts from font marks in TextTile content", () => {
    const doc = createDoc();
    addTextTile(doc, "text-1", fontParagraph("lora"));
    expect(getPageFonts(doc)).toEqual(new Set(["lora"]));
  });

  test("includes fonts from font marks in the document body", () => {
    const doc = createDoc();
    prosemirrorToYXmlFragment(deserialize(fontParagraph("quicksand")), getBody(doc));
    expect(getPageFonts(doc)).toEqual(new Set(["quicksand"]));
  });

  test("includes fonts from font marks in ImageTile text", () => {
    const doc = createDoc();
    addTile(
      doc,
      "image-1",
      Image.createMap({
        imageId: "image",
        size: { width: 1, height: 1 },
        text: fontParagraph("quicksand"),
      }),
    );
    expect(getPageFonts(doc)).toEqual(new Set(["quicksand"]));
  });

  test("merges mark fonts with theme fonts", () => {
    const doc = createDoc([THEME]);
    addTextTile(doc, "text-1", fontParagraph("dynapuff"));
    expect(getPageFonts(doc)).toEqual(new Set(["lora", "inter", "jetbrains-mono", "dynapuff"]));
  });
});

describe("getPagePreloads", () => {
  test("preloads the default font when nothing is set", () => {
    const preloads = getPagePreloads(createDoc());
    expect(preloads).toHaveLength(1);
    expect(preloads[0]?.href).toContain("inter-latin-wght-normal");
    expect(preloads[0]?.as).toBe("font");
  });

  test("respects the page font override", () => {
    const doc = createDoc();
    doc.getMap("metadata").set("font", "lora");
    const preloads = getPagePreloads(doc);
    expect(preloads).toHaveLength(1);
    expect(preloads[0]?.href).toContain("lora-latin-wght-normal");
  });

  test("falls back to theme.fonts.body when no page font", () => {
    const theme: Theme = {
      ...THEME,
      fonts: { heading: "lora", body: "quicksand", code: "jetbrains-mono" },
    };
    const preloads = getPagePreloads(createDoc([theme], theme.id));
    expect(preloads).toHaveLength(2);
    expect(preloads[0]?.href).toContain("quicksand-latin-wght-normal");
    expect(preloads[1]?.href).toContain("lora-latin-wght-normal");
  });

  test("emits one preload when heading and body are the same font", () => {
    const theme: Theme = {
      ...THEME,
      fonts: { heading: "inter", body: "inter", code: "jetbrains-mono" },
    };
    const preloads = getPagePreloads(createDoc([theme], theme.id));
    expect(preloads).toHaveLength(1);
    expect(preloads[0]?.href).toContain("inter-latin-wght-normal");
  });
});
