import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import { getBody } from "@/body";
import { pageToMarkdown } from "@/markdown/page";
import { dockParentId } from "@/placement/parentId";
import { insertTile } from "@/richText/tiles";
import { appendParagraph, placeTile, writeText } from "@/test/tiles";
import { buildImageMap } from "@/tiles/image";
import { buildPageLinkMap } from "@/tiles/pageLink";
import { buildSectionMap } from "@/tiles/section";
import { buildTextMap } from "@/tiles/text";

function page(): { doc: Y.Doc; tiles: Y.Map<Y.Map<unknown>> } {
  const doc = new Y.Doc();
  return { doc, tiles: doc.getMap<Y.Map<unknown>>("tiles") };
}

/** A text tile placed in a container, with one paragraph. */
function textTile(
  tiles: Y.Map<Y.Map<unknown>>,
  id: string,
  text: string,
  parentId: string | null = null,
  order = "a0",
  hide = false,
): Y.Map<unknown> {
  const tile = placeTile(tiles, id, buildTextMap({ hide }), parentId, order);
  writeText(tile, text);
  return tile;
}

describe("pageToMarkdown", () => {
  test("heads the output with the page title", () => {
    expect(pageToMarkdown(page().doc, { title: "Untitled *draft*", type: "LAYOUT" })).toBe(
      "# Untitled \\*draft\\*\n",
    );
  });

  test("leaves out the heading for a blank title", () => {
    const { doc, tiles } = page();
    textTile(tiles, "t", "Content");
    expect(pageToMarkdown(doc, { title: "  ", type: "LAYOUT" })).toBe("Content\n");
  });

  describe("document", () => {
    test("renders the body with its embedded tiles, skipping hidden ones", () => {
      const { doc, tiles } = page();
      const body = getBody(doc);
      appendParagraph(body, "Intro");
      textTile(tiles, "embedded", "Embedded");
      insertTile(body, "embedded");
      textTile(tiles, "hidden", "Hidden", null, "a0", true);
      insertTile(body, "hidden");
      appendParagraph(body, "Outro");

      expect(pageToMarkdown(doc, { title: "My Doc", type: "DOCUMENT" })).toBe(
        "# My Doc\n\nIntro\n\nEmbedded\n\nOutro\n",
      );
    });

    test("passes the URL builders to the tiles", () => {
      const { doc, tiles } = page();
      const body = getBody(doc);
      placeTile(tiles, "img", buildImageMap({ imageId: "i1", size: { width: 1, height: 1 } }));
      insertTile(body, "img");
      placeTile(tiles, "link", buildPageLinkMap({ linkedPage: { id: "p2", title: "Next" } }));
      insertTile(body, "link");

      const markdown = pageToMarkdown(doc, {
        title: "Doc",
        type: "DOCUMENT",
        imageUrl: (id) => `https://images.test/${id}`,
        pageUrl: (id) => `https://tiles.test/pages/${id}`,
      });
      expect(markdown).toBe(
        "# Doc\n\n![](https://images.test/i1)\n\n[Next](https://tiles.test/pages/p2)\n",
      );
    });
  });

  describe("presentation", () => {
    test("separates the slides with a rule and skips hidden slides and non-sections", () => {
      const { doc, tiles } = page();
      placeTile(tiles, "s1", buildSectionMap({}), null, "a0");
      textTile(tiles, "t1", "Slide one", "s1");
      placeTile(tiles, "s2", buildSectionMap({}), null, "a1");
      textTile(tiles, "t2", "Slide two", "s2");
      placeTile(tiles, "s3", buildSectionMap({ hide: true }), null, "a2");
      textTile(tiles, "t3", "Hidden slide", "s3");
      textTile(tiles, "stray", "Not a slide", null, "a3");

      expect(pageToMarkdown(doc, { title: "Deck", type: "PRESENTATION" })).toBe(
        "# Deck\n\nSlide one\n\n---\n\nSlide two\n",
      );
    });
  });

  describe("layout", () => {
    test("renders the docks around the page in reading order", () => {
      const { doc, tiles } = page();
      textTile(tiles, "main", "Main", null, "a0");
      textTile(tiles, "hidden", "Hidden", null, "a1", true);
      textTile(tiles, "bottom", "Bottom", dockParentId("BOTTOM"));
      textTile(tiles, "right", "Right", dockParentId("RIGHT"));
      textTile(tiles, "left", "Left", dockParentId("LEFT"));
      textTile(tiles, "top", "Top", dockParentId("TOP"));

      expect(pageToMarkdown(doc, { title: "Page", type: "LAYOUT" })).toBe(
        "# Page\n\nTop\n\nLeft\n\nMain\n\nRight\n\nBottom\n",
      );
    });
  });
});
