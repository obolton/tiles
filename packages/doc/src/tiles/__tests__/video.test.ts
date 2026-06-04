import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import { buildVideoMap } from "@/tiles/video";

describe("buildVideoMap", () => {
  test("sets video fields", () => {
    const doc = new Y.Doc();
    const map = buildVideoMap({
      videoType: "YOUTUBE",
      videoId: "vid",
      title: "Title",
      description: null,
      imageUrl: null,
    });
    doc.getMap().set("tile", map);

    expect(map.get("type")).toBe("VIDEO");
    expect(map.get("videoType")).toBe("YOUTUBE");
    expect(map.get("videoId")).toBe("vid");
    expect(map.get("title")).toBe("Title");
    expect(map.get("description")).toBeNull();
    expect(map.get("imageUrl")).toBeNull();
  });
});
