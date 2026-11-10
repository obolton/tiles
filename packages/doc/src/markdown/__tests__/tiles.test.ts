import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import { isHidden, renderTile, tileToMarkdown } from "@/markdown/tiles";
import { orderedEntries } from "@/placement/ordering";
import { createTileElement } from "@/richText/tiles";
import { placeTile, writeText } from "@/test/tiles";
import { buildChartMap } from "@/tiles/chart";
import { buildImageMap } from "@/tiles/image";
import { buildLinkMap } from "@/tiles/link";
import { buildPageLinkMap } from "@/tiles/pageLink";
import { buildSectionMap } from "@/tiles/section";
import { buildTableMap } from "@/tiles/table";
import { buildTextMap } from "@/tiles/text";
import { buildVideoMap } from "@/tiles/video";
import { TextFormat } from "@/types/richText";
import type { RichText } from "@/types/richText";

function tiles(): Y.Map<Y.Map<unknown>> {
  return new Y.Doc().getMap<Y.Map<unknown>>("tiles");
}

const paragraph = (text: string, format = TextFormat.NONE): RichText => [
  { type: "paragraph", children: [{ type: "text", text, format }] },
];

const imageUrl = (imageId: string) => `https://images.test/${imageId}`;
const pageUrl = (pageId: string) => `https://tiles.test/pages/${pageId}`;

const IMAGE = { imageId: "img", size: { width: 1, height: 1 } };
const VIDEO = {
  videoType: "YOUTUBE" as const,
  videoId: "vid",
  title: "My Video",
  description: "A description",
  imageUrl: null,
};
const LINK = {
  url: "https://example.com",
  title: "Example",
  description: "An example",
  siteName: "Example Site",
  imageId: null,
};

const column = (id: string, title: string) => ({
  type: "BAR" as const,
  column: { id, title },
  fill: null,
});

function setCell(table: Y.Map<unknown>, columnId: string, value: unknown) {
  const rows = table.get("rows");
  if (!(rows instanceof Y.Map)) {
    throw new Error("Expected a rows map");
  }
  const cells = orderedEntries(rows)[0]?.map.get("cells");
  if (!(cells instanceof Y.Map)) {
    throw new Error("Expected a cells map");
  }
  cells.set(columnId, value);
}

describe("tileToMarkdown", () => {
  describe("text", () => {
    test("serializes the content fragment", () => {
      const map = tiles();
      const tile = placeTile(map, "t", buildTextMap({}));
      writeText(tile, "Hello world");
      expect(tileToMarkdown(tile, { tiles: map })).toBe("Hello world");
    });

    test("renders tiles embedded in the content through the tile option", () => {
      const map = tiles();
      const tile = placeTile(map, "t", buildTextMap({}));
      const content = tile.get("content");
      if (!(content instanceof Y.XmlFragment)) {
        throw new Error("Expected a content fragment");
      }
      content.insert(0, [createTileElement("embedded")]);
      expect(tileToMarkdown(tile, { tiles: map, tile: (id) => `![${id}]` })).toBe("![embedded]");
    });
  });

  describe("image", () => {
    test("renders the caption alone without an image URL", () => {
      const map = tiles();
      const tile = placeTile(map, "i", buildImageMap({ ...IMAGE, text: paragraph("A caption") }));
      expect(tileToMarkdown(tile, { tiles: map })).toBe("A caption");
    });

    test("renders the image with its alt text and caption", () => {
      const map = tiles();
      const tile = placeTile(
        map,
        "i",
        buildImageMap({
          ...IMAGE,
          alt: "A [sunset]",
          text: paragraph("A caption", TextFormat.BOLD),
        }),
      );
      expect(tileToMarkdown(tile, { tiles: map, imageUrl })).toBe(
        "![A \\[sunset\\]](https://images.test/img)\n\n**A caption**",
      );
    });

    test("renders an image without alt text or caption", () => {
      const map = tiles();
      const tile = placeTile(map, "i", buildImageMap(IMAGE));
      expect(tileToMarkdown(tile, { tiles: map, imageUrl })).toBe("![](https://images.test/img)");
    });
  });

  describe("video", () => {
    test("links the title to the video and adds the description", () => {
      const map = tiles();
      const tile = placeTile(map, "v", buildVideoMap(VIDEO));
      expect(tileToMarkdown(tile, { tiles: map })).toBe(
        "[My Video](https://www.youtube.com/watch?v=vid)\n\nA description",
      );
    });

    test("links to Vimeo and falls back to the URL as the text", () => {
      const map = tiles();
      const tile = placeTile(
        map,
        "v",
        buildVideoMap({ ...VIDEO, videoType: "VIMEO", title: "", description: null }),
      );
      expect(tileToMarkdown(tile, { tiles: map })).toBe(
        "[https://vimeo.com/vid](https://vimeo.com/vid)",
      );
    });

    test("renders nothing without a video id", () => {
      const map = tiles();
      const tile = placeTile(map, "v", buildVideoMap({ ...VIDEO, videoId: "" }));
      expect(tileToMarkdown(tile, { tiles: map })).toBe("");
    });
  });

  describe("link", () => {
    test("links the title to the URL and adds the description", () => {
      const map = tiles();
      const tile = placeTile(map, "l", buildLinkMap(LINK));
      expect(tileToMarkdown(tile, { tiles: map })).toBe(
        "[Example](https://example.com)\n\nAn example",
      );
    });

    test("falls back to the site name, then the URL, for the text", () => {
      const map = tiles();
      const site = placeTile(map, "a", buildLinkMap({ ...LINK, title: null, description: null }));
      const bare = placeTile(map, "b", buildLinkMap({ ...LINK, title: null, siteName: null }));
      expect(tileToMarkdown(site, { tiles: map })).toBe("[Example Site](https://example.com)");
      expect(tileToMarkdown(bare, { tiles: map })).toBe(
        "[https://example.com](https://example.com)\n\nAn example",
      );
    });
  });

  describe("page link", () => {
    const linkedPage = { id: "linked-page", title: "Linked Page" };

    test("renders the title alone without a page URL", () => {
      const map = tiles();
      const tile = placeTile(map, "p", buildPageLinkMap({ linkedPage }));
      expect(tileToMarkdown(tile, { tiles: map })).toBe("Linked Page");
    });

    test("links the title to the page", () => {
      const map = tiles();
      const tile = placeTile(map, "p", buildPageLinkMap({ linkedPage }));
      expect(tileToMarkdown(tile, { tiles: map, pageUrl })).toBe(
        "[Linked Page](https://tiles.test/pages/linked-page)",
      );
    });
  });

  describe("table", () => {
    test("renders a GFM table from the columns and rows", () => {
      const map = tiles();
      const tile = placeTile(
        map,
        "t",
        buildTableMap({
          columns: [
            { id: "c1", title: "Name" },
            { id: "c2", title: "Age" },
          ],
          rows: [{ cells: ["Alice", "30"] }, { cells: ["Bob", null] }],
        }),
      );
      expect(tileToMarkdown(tile, { tiles: map })).toBe(
        "| Name | Age |\n| --- | --- |\n| Alice | 30 |\n| Bob |  |",
      );
    });

    test("escapes pipes and collapses newlines in cells", () => {
      const map = tiles();
      const tile = placeTile(
        map,
        "t",
        buildTableMap({
          columns: [{ id: "c1", title: "A | B" }],
          rows: [{ cells: ["line1\nline2 | x"] }],
        }),
      );
      expect(tileToMarkdown(tile, { tiles: map })).toBe(
        "| A \\| B |\n| --- |\n| line1 line2 \\| x |",
      );
    });

    test("renders rich text cells inline", () => {
      const map = tiles();
      const tile = placeTile(
        map,
        "t",
        buildTableMap({ columns: [{ id: "c1", title: "Note" }], rows: 1 }),
      );
      setCell(tile, "c1", [...paragraph("Bold", TextFormat.BOLD), ...paragraph("Next")]);
      expect(tileToMarkdown(tile, { tiles: map })).toBe("| Note |\n| --- |\n| **Bold** Next |");
    });

    test("renders nothing for a table without columns", () => {
      const map = tiles();
      const tile = placeTile(map, "t", buildTableMap({ rows: 2 }));
      expect(tileToMarkdown(tile, { tiles: map })).toBe("");
    });
  });

  describe("chart", () => {
    test("describes the series and label in a placeholder", () => {
      const map = tiles();
      const tile = placeTile(
        map,
        "c",
        buildChartMap({
          tableId: "t",
          label: { id: "l", title: "Month" },
          series: [column("c1", "Revenue"), column("c2", "Profit")],
        }),
      );
      expect(tileToMarkdown(tile, { tiles: map })).toBe("*Chart: Revenue, Profit by Month*");
    });

    test("describes the label alone", () => {
      const map = tiles();
      const tile = placeTile(
        map,
        "c",
        buildChartMap({ tableId: "t", label: { id: "l", title: "Month" } }),
      );
      expect(tileToMarkdown(tile, { tiles: map })).toBe("*Chart by Month*");
    });

    test("falls back to a bare placeholder", () => {
      const map = tiles();
      const tile = placeTile(map, "c", buildChartMap({ tableId: "t" }));
      expect(tileToMarkdown(tile, { tiles: map })).toBe("*Chart*");
    });
  });

  describe("section", () => {
    test("renders its children in order, skipping hidden ones", () => {
      const map = tiles();
      const section = placeTile(map, "s", buildSectionMap({}));
      writeText(placeTile(map, "b", buildTextMap({}), "s", "a1"), "Second");
      writeText(placeTile(map, "a", buildTextMap({}), "s", "a0"), "First");
      writeText(placeTile(map, "h", buildTextMap({ hide: true }), "s", "a2"), "Hidden");
      expect(tileToMarkdown(section, { tiles: map })).toBe("First\n\nSecond");
    });

    test("renders nested sections", () => {
      const map = tiles();
      const outer = placeTile(map, "outer", buildSectionMap({}));
      placeTile(map, "inner", buildSectionMap({}), "outer");
      writeText(placeTile(map, "t", buildTextMap({}), "inner"), "Deep");
      expect(tileToMarkdown(outer, { tiles: map })).toBe("Deep");
    });

    test("renders children through the tile option", () => {
      const map = tiles();
      const section = placeTile(map, "s", buildSectionMap({}));
      placeTile(map, "a", buildTextMap({}), "s");
      expect(tileToMarkdown(section, { tiles: map, tile: (id) => `[${id}]` })).toBe("[a]");
    });
  });

  test("renders nothing for an unknown tile type", () => {
    const map = tiles();
    const tile = placeTile(map, "u", new Y.Map([["type", "UNKNOWN"]]));
    expect(tileToMarkdown(tile, { tiles: map })).toBe("");
  });

  test("renders a hidden tile that is referenced directly", () => {
    const map = tiles();
    const tile = placeTile(map, "t", buildTextMap({ hide: true }));
    writeText(tile, "Hidden");
    expect(tileToMarkdown(tile, { tiles: map })).toBe("Hidden");
  });
});

describe("renderTile", () => {
  test("renders the tile with the id", () => {
    const map = tiles();
    writeText(placeTile(map, "t", buildTextMap({})), "Hello");
    expect(renderTile("t", { tiles: map })).toBe("Hello");
  });

  test("renders nothing for a missing tile", () => {
    expect(renderTile("ghost", { tiles: tiles() })).toBe("");
  });

  test("renders nothing for a hidden tile", () => {
    const map = tiles();
    writeText(placeTile(map, "t", buildTextMap({ hide: true })), "Hidden");
    expect(renderTile("t", { tiles: map })).toBe("");
  });
});

describe("isHidden", () => {
  test("reads the hide flag", () => {
    const map = tiles();
    expect(isHidden(placeTile(map, "a", buildTextMap({ hide: true })))).toBe(true);
    expect(isHidden(placeTile(map, "b", buildTextMap({})))).toBe(false);
  });
});
