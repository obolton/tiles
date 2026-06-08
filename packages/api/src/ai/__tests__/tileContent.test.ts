import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import { buildTextMap } from "doc/tiles/text";
import { buildImageMap } from "doc/tiles/image";
import { buildVideoMap } from "doc/tiles/video";
import { buildLinkMap } from "doc/tiles/link";
import { buildPageLinkMap } from "doc/tiles/pageLink";
import { buildChartMap } from "doc/tiles/chart";
import { buildSectionMap } from "doc/tiles/section";
import { getTileContent, resolveTileContents } from "@/ai/tileContent";
import type { RichTextSchema } from "@/schema/RichText";

function tiles(): { doc: Y.Doc; tiles: Y.Map<Y.Map<unknown>> } {
  const doc = new Y.Doc();
  return { doc, tiles: doc.getMap<Y.Map<unknown>>("tiles") };
}

function place(
  map: Y.Map<Y.Map<unknown>>,
  id: string,
  tile: Y.Map<unknown>,
  parentId: string | null = null,
  order = "a0",
): Y.Map<unknown> {
  tile.set("id", id);
  tile.set("parentId", parentId);
  tile.set("order", order);
  map.set(id, tile);
  return tile;
}

function writeText(tile: Y.Map<unknown>, markdown: string): void {
  const content = tile.get("content");
  if (!(content instanceof Y.XmlFragment)) {
    throw new Error("expected a content fragment");
  }
  const paragraph = new Y.XmlElement("paragraph");
  const text = new Y.XmlText();
  text.insert(0, markdown);
  paragraph.insert(0, [text]);
  content.insert(0, [paragraph]);
}

describe("getTileContent", () => {
  test("serializes a text tile's content fragment", () => {
    const { tiles: map } = tiles();
    const tile = place(map, "t", buildTextMap({}));
    writeText(tile, "Hello world");
    expect(getTileContent(tile)).toBe("Hello world");
  });

  test("serializes an image caption from its JSON", () => {
    const { tiles: map } = tiles();
    const caption: RichTextSchema = [
      {
        type: "paragraph",
        children: [{ type: "text", text: "A caption", format: 0 }],
      },
    ];
    const tile = place(
      map,
      "i",
      buildImageMap({
        imageId: "img",
        size: { width: 1, height: 1 },
        text: caption,
      }),
    );
    expect(getTileContent(tile)).toBe("A caption");
  });

  test("joins a video's title and description", () => {
    const { tiles: map } = tiles();
    const tile = place(
      map,
      "v",
      buildVideoMap({
        videoType: "YOUTUBE",
        videoId: "vid",
        title: "My Video",
        description: "A description",
        imageUrl: null,
      }),
    );
    expect(getTileContent(tile)).toBe("My Video\nA description");
  });

  test("joins a link's title, description and url", () => {
    const { tiles: map } = tiles();
    const tile = place(
      map,
      "l",
      buildLinkMap({
        url: "https://example.com",
        title: "Example",
        description: "An example",
        siteName: null,
        imageId: null,
      }),
    );
    expect(getTileContent(tile)).toBe(
      "Example\nAn example\nhttps://example.com",
    );
  });

  test("reads a page link's target title", () => {
    const { tiles: map } = tiles();
    const tile = place(
      map,
      "p",
      buildPageLinkMap({ linkedPage: { title: "Linked Page" } }),
    );
    expect(getTileContent(tile)).toBe("Linked Page");
  });

  test("summarizes a chart's label and series", () => {
    const { tiles: map } = tiles();
    const tile = place(
      map,
      "c",
      buildChartMap({ tableId: "t1", label: { id: "l", title: "Month" } }),
    );
    const series = tile.get("series") as Y.Map<Y.Map<unknown>>;
    const revenue = new Y.Map<unknown>();
    revenue.set("column", { id: "c1", title: "Revenue" });
    series.set("s1", revenue);
    const profit = new Y.Map<unknown>();
    profit.set("column", { id: "c2", title: "Profit" });
    series.set("s2", profit);

    expect(getTileContent(tile)).toBe("Labels: Month\nSeries: Revenue, Profit");
  });

  test("yields no content for a table (not yet in the Y.Doc)", () => {
    const { tiles: map } = tiles();
    const tile = new Y.Map<unknown>();
    tile.set("type", "TABLE");
    place(map, "tab", tile);
    expect(getTileContent(tile)).toBe("");
  });
});

describe("resolveTileContents", () => {
  test("resolves referenced tiles to their content", () => {
    const { doc, tiles: map } = tiles();
    const tile = place(map, "t", buildTextMap({}));
    writeText(tile, "Referenced");

    expect(resolveTileContents(doc, ["t"])).toEqual([
      { id: "t", type: "TEXT", content: "Referenced" },
    ]);
  });

  test("expands a referenced section to its children and omits the section", () => {
    const { doc, tiles: map } = tiles();
    place(map, "sec", buildSectionMap({}));
    const child = place(map, "child", buildTextMap({}), "sec");
    writeText(child, "Inside the section");

    expect(resolveTileContents(doc, ["sec"])).toEqual([
      { id: "child", type: "TEXT", content: "Inside the section" },
    ]);
  });

  test("skips ids missing from the doc", () => {
    const { doc } = tiles();
    expect(resolveTileContents(doc, ["ghost"])).toEqual([]);
  });
});
