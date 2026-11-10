import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import { BODY_ID, getBody } from "doc/body";
import { insertTile } from "doc/richText/tiles";
import { appendParagraph, placeTile, writeText } from "doc/test/tiles";
import { buildLinkMap } from "doc/tiles/link";
import { buildSectionMap } from "doc/tiles/section";
import { buildTextMap } from "doc/tiles/text";
import { resolveTileContents } from "@/ai/tileContent";

function tiles(): { doc: Y.Doc; tiles: Y.Map<Y.Map<unknown>> } {
  const doc = new Y.Doc();
  return { doc, tiles: doc.getMap<Y.Map<unknown>>("tiles") };
}

const LINK = {
  url: "https://example.com",
  title: "Example",
  description: null,
  siteName: null,
  imageId: null,
};

describe("resolveTileContents", () => {
  test("resolves referenced tiles to their content", () => {
    const { doc, tiles: map } = tiles();
    const tile = placeTile(map, "t", buildTextMap({}));
    writeText(tile, "Referenced");

    expect(resolveTileContents(doc, ["t"])).toEqual([
      { id: "t", type: "TEXT", content: "Referenced" },
    ]);
  });

  test("serializes tiles as Markdown", () => {
    const { doc, tiles: map } = tiles();
    placeTile(map, "l", buildLinkMap({ ...LINK, description: "An example" }));

    expect(resolveTileContents(doc, ["l"])).toEqual([
      { id: "l", type: "LINK", content: "[Example](https://example.com)\n\nAn example" },
    ]);
  });

  test("expands a referenced section to its children and omits the section", () => {
    const { doc, tiles: map } = tiles();
    placeTile(map, "sec", buildSectionMap({}));
    const child = placeTile(map, "child", buildTextMap({}), "sec");
    writeText(child, "Inside the section");

    expect(resolveTileContents(doc, ["sec"])).toEqual([
      { id: "child", type: "TEXT", content: "Inside the section" },
    ]);
  });

  test("includes hidden tiles that are referenced", () => {
    const { doc, tiles: map } = tiles();
    const tile = placeTile(map, "t", buildTextMap({ hide: true }));
    writeText(tile, "Hidden");

    expect(resolveTileContents(doc, ["t"])).toEqual([{ id: "t", type: "TEXT", content: "Hidden" }]);
  });

  test("skips ids missing from the doc", () => {
    const { doc } = tiles();
    expect(resolveTileContents(doc, ["ghost"])).toEqual([]);
  });

  describe("document body", () => {
    test("resolves the body with its embedded tiles inlined and listed after it", () => {
      const { doc, tiles: map } = tiles();
      const body = getBody(doc);
      appendParagraph(body, "Intro");
      const link = buildLinkMap(LINK);
      link.set("id", "l");
      link.set("parentId", null);
      map.set("l", link);
      insertTile(body, "l");

      expect(resolveTileContents(doc, [BODY_ID], body)).toEqual([
        {
          id: BODY_ID,
          type: "TEXT",
          content: "Intro\n\n[1] (LINK)\n[Example](https://example.com)",
        },
        { id: "l", type: "LINK", content: "[Example](https://example.com)" },
      ]);
    });

    test("marks an embedded tile without content as empty", () => {
      const { doc, tiles: map } = tiles();
      const body = getBody(doc);
      const text = buildTextMap({});
      text.set("id", "t");
      text.set("parentId", null);
      map.set("t", text);
      insertTile(body, "t");

      expect(resolveTileContents(doc, [BODY_ID], body)).toEqual([
        { id: BODY_ID, type: "TEXT", content: "[1] (TEXT, empty)" },
        { id: "t", type: "TEXT", content: "" },
      ]);
    });

    test("inlines the children of an embedded section", () => {
      const { doc, tiles: map } = tiles();
      const body = getBody(doc);
      const section = placeTile(map, "sec", buildSectionMap({}));
      section.set("order", undefined);
      insertTile(body, "sec");
      const child = placeTile(map, "child", buildTextMap({}), "sec");
      writeText(child, "Inside");

      expect(resolveTileContents(doc, [BODY_ID], body)).toEqual([
        { id: BODY_ID, type: "TEXT", content: "[1] (TEXT)\nInside" },
        { id: "child", type: "TEXT", content: "Inside" },
      ]);
    });

    test("ignores the body id without a body", () => {
      const { doc } = tiles();
      expect(resolveTileContents(doc, [BODY_ID])).toEqual([]);
    });
  });
});
