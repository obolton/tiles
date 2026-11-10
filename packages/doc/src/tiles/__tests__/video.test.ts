import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import { buildVideoMap, getVideoUrl } from "@/tiles/video";

describe("getVideoUrl", () => {
  test("builds a YouTube watch URL", () => {
    expect(getVideoUrl("YOUTUBE", "abc123")).toBe("https://www.youtube.com/watch?v=abc123");
  });

  test("builds a Vimeo URL", () => {
    expect(getVideoUrl("VIMEO", "987")).toBe("https://vimeo.com/987");
  });
});

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

function attach(map: Y.Map<unknown>) {
  new Y.Doc().getMap().set("tile", map);
  return map;
}

describe("buildVideoMap sizing", () => {
  const VIDEO = {
    videoType: "YOUTUBE" as const,
    videoId: "vid",
    title: "Title",
    description: null,
    imageUrl: null,
  };

  test("defaults to landscape sizing", () => {
    expect(attach(buildVideoMap(VIDEO)).get("sizing")).toBe("LANDSCAPE");
  });

  test("keeps an explicit sizing", () => {
    expect(attach(buildVideoMap({ ...VIDEO, sizing: "SQUARE" })).get("sizing")).toBe("SQUARE");
  });
});
