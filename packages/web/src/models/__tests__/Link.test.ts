import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import Link from "@/models/Link";
import Video from "@/models/Video";
import { createEditor } from "@/test/editor";
import { PAGE } from "@/test/fixtures/Page";
import client from "@/api/client";
import type Editor from "@/editor/Editor";

vi.mock("@/collaboration/PageCollaboration", () => import("@/test/mocks/PageCollaboration"));

const LINK_PROPS = {
  url: "https://tiles.dev",
  title: "Link title",
  description: "Link description",
  siteName: "Test",
  imageId: "image-id",
};

vi.mock("@/api/client", () => ({
  default: {
    externalLinks: {
      getMetadata: {
        query: vi.fn(),
      },
    },
  },
}));

describe("Link", () => {
  const getMetadataMock = vi.mocked(client.externalLinks.getMetadata.query);
  let editor: Editor;

  beforeEach(() => {
    editor = createEditor();
  });

  afterEach(() => {
    getMetadataMock.mockReset();
  });

  function createLink(): Link {
    return editor.page.createTile(Link.createMap(LINK_PROPS), {}) as Link;
  }

  test("maps properties to reactive values", () => {
    const link = createLink();

    expect(link.url.value).toBe(LINK_PROPS.url);
    expect(link.title.value).toBe(LINK_PROPS.title);
    expect(link.description.value).toBe(LINK_PROPS.description);
    expect(link.siteName.value).toBe(LINK_PROPS.siteName);
    expect(link.imageId.value).toBe(LINK_PROPS.imageId);
  });

  describe("create", () => {
    test("creates a link card with the resolved metadata", async () => {
      const url = "https://tiles.dev";
      getMetadataMock.mockResolvedValue({ type: "LINK", ...LINK_PROPS });

      const link = await Link.create(editor.page, { url, width: 5, height: 5 });

      expect(getMetadataMock).toHaveBeenCalledWith({ pageId: PAGE.id, url });
      expect(link).toBeInstanceOf(Link);
      expect(link.title.value).toBe(LINK_PROPS.title);
      expect(link.width.value).toBe(5);
      expect(link.height.value).toBe(5);
    });

    test("creates a video with its own sizing when the URL is a video", async () => {
      const url = "https://youtu.be/abc123";
      getMetadataMock.mockResolvedValue({
        type: "VIDEO",
        videoType: "YOUTUBE",
        videoId: "abc123",
        title: "A video",
        description: null,
        imageUrl: null,
      });

      const video = await Link.create(editor.page, { url, width: 5, height: 5 });

      expect(video).toBeInstanceOf(Video);
      expect(video.sizing.value).toBe("LANDSCAPE");
      expect(video.width.value).toBeNull();
    });
  });

  test("updates the url and refreshes metadata from the server", async () => {
    const link = createLink();
    const nextUrl = "https://tiles.dev/updated";
    const nextMetadata = {
      type: "LINK" as const,
      url: nextUrl,
      title: "Updated title",
      description: "Updated description",
      siteName: "Updated site",
      imageId: "updated-image-id",
    };

    getMetadataMock.mockResolvedValue(nextMetadata);

    await link.setUrl(nextUrl);

    expect(getMetadataMock).toHaveBeenCalledWith({
      pageId: PAGE.id,
      url: nextUrl,
    });
    expect(link.url.value).toBe(nextUrl);
    expect(link.title.value).toBe(nextMetadata.title);
    expect(link.description.value).toBe(nextMetadata.description);
    expect(link.siteName.value).toBe(nextMetadata.siteName);
    expect(link.imageId.value).toBe(nextMetadata.imageId);
  });
});
