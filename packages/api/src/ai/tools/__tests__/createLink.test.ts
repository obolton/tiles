import { beforeEach, describe, expect, test, vi } from "vitest";
import * as Y from "yjs";
import { resolveLinkMetadata } from "@/routes/links/links";
import { createToolContext, getCreatedTile } from "@/test/fixtures/ai";
import { CREATE_LINK_TOOL } from "../createLink";
import type { ToolContext } from "../types";

vi.mock("@/routes/links/links", () => ({
  resolveLinkMetadata: vi.fn(),
}));

const BASE_ARGS = {
  parentId: null,
  url: "https://example.com",
  size: "medium" as const,
  coordinates: null,
};

describe("CREATE_LINK_TOOL", () => {
  let doc: Y.Doc;
  let context: ToolContext;

  beforeEach(() => {
    ({ doc, context } = createToolContext());
  });

  test("creates a link tile from the unfurled metadata", async () => {
    vi.mocked(resolveLinkMetadata).mockResolvedValue({
      type: "LINK",
      url: "https://example.com",
      preview: {
        title: "Example",
        description: "An example site",
        siteName: "example.com",
        imageId: "image-1",
      },
    });

    const result = await CREATE_LINK_TOOL.function(BASE_ARGS, context);

    expect(result).toMatchObject({ type: "LINK" });
    const map = getCreatedTile(doc, result);
    expect(map.get("type")).toBe("LINK");
    expect(map.get("url")).toBe("https://example.com");
    expect(map.get("title")).toBe("Example");
    expect(map.get("siteName")).toBe("example.com");
    expect(map.get("imageId")).toBe("image-1");
  });

  test("creates a video tile when the URL resolves to a video", async () => {
    vi.mocked(resolveLinkMetadata).mockResolvedValue({
      type: "VIDEO",
      videoType: "YOUTUBE",
      videoId: "abc123",
      title: "A video",
      description: null,
      imageUrl: "https://img.example/thumb.jpg",
    });

    const result = await CREATE_LINK_TOOL.function(
      { ...BASE_ARGS, url: "https://youtube.com/watch?v=abc123" },
      context,
    );

    expect(result).toMatchObject({ type: "VIDEO" });
    const map = getCreatedTile(doc, result);
    expect(map.get("type")).toBe("VIDEO");
    expect(map.get("videoType")).toBe("YOUTUBE");
    expect(map.get("videoId")).toBe("abc123");
    expect(map.get("title")).toBe("A video");
  });

  test("creates a link tile without a preview when the page cannot be fetched", async () => {
    vi.mocked(resolveLinkMetadata).mockResolvedValue({
      type: "LINK",
      url: "https://example.com",
      preview: null,
    });

    const result = await CREATE_LINK_TOOL.function(BASE_ARGS, context);

    expect(result).toMatchObject({ type: "LINK" });
    const map = getCreatedTile(doc, result);
    expect(map.get("url")).toBe("https://example.com");
    expect(map.get("title")).toBeNull();
    expect(map.get("imageId")).toBeNull();
  });

  test("resolves an args parentId to the parent", async () => {
    vi.mocked(resolveLinkMetadata).mockResolvedValue({
      type: "LINK",
      url: "https://example.com",
      preview: null,
    });

    const result = await CREATE_LINK_TOOL.function({ ...BASE_ARGS, parentId: 0 }, context);

    expect(context.resolveArtifactId).toHaveBeenCalledWith(0);
    expect(getCreatedTile(doc, result).get("parentId")).toBe("resolved-0");
  });
});
