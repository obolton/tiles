import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import { buildLinkMap } from "@/tiles/link";

describe("buildLinkMap", () => {
  test("derives an image background from imageId", () => {
    const doc = new Y.Doc();
    const map = buildLinkMap({
      url: "https://example.com",
      title: null,
      description: null,
      siteName: null,
      imageId: "img",
    });
    doc.getMap().set("tile", map);

    expect(map.get("type")).toBe("LINK");
    expect(map.get("url")).toBe("https://example.com");
    expect(map.get("imageId")).toBe("img");
    expect(map.get("background")).toEqual({ type: "image", imageId: "img" });
  });

  test("uses the provided background when there is no imageId", () => {
    const doc = new Y.Doc();
    const map = buildLinkMap({
      url: "https://example.com",
      title: null,
      description: null,
      siteName: null,
      imageId: null,
      background: { type: "color", color: "abcabc" },
    });
    doc.getMap().set("tile", map);

    expect(map.get("background")).toEqual({ type: "color", color: "abcabc" });
  });
});
