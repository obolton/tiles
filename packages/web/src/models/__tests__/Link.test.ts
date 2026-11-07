import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import Link, { LinkPreviewError } from "@/models/Link";
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

const { url: _url, ...PREVIEW } = LINK_PROPS;

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
      getMetadataMock.mockResolvedValue({ type: "LINK", url, preview: PREVIEW });

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

    test("rejects without creating a tile when no preview is available", async () => {
      const url = "https://tiles.dev/missing";
      getMetadataMock.mockResolvedValue({ type: "LINK", url, preview: null });

      await expect(Link.create(editor.page, { url })).rejects.toThrow(LinkPreviewError);

      expect(editor.page.tiles.value).toHaveLength(0);
    });

    test("creates a link card without a preview when one is not wanted", async () => {
      const url = "https://tiles.dev/missing";

      const link = await Link.create(editor.page, { url, preview: false });

      expect(getMetadataMock).not.toHaveBeenCalled();
      if (!(link instanceof Link)) {
        throw new Error("Expected a link");
      }
      expect(link.url.value).toBe(url);
      expect(link.title.value).toBeNull();
      expect(link.description.value).toBeNull();
      expect(link.siteName.value).toBeNull();
      expect(link.imageId.value).toBeNull();
    });
  });

  describe("setUrl", () => {
    const nextUrl = "https://tiles.dev/updated";
    const nextPreview = {
      title: "Updated title",
      description: "Updated description",
      siteName: "Updated site",
      imageId: "updated-image-id",
    };

    test("updates the url and refreshes metadata from the server", async () => {
      const link = createLink();
      getMetadataMock.mockResolvedValue({ type: "LINK", url: nextUrl, preview: nextPreview });

      await link.setUrl(nextUrl);

      expect(getMetadataMock).toHaveBeenCalledWith({
        pageId: PAGE.id,
        url: nextUrl,
      });
      expect(link.url.value).toBe(nextUrl);
      expect(link.title.value).toBe(nextPreview.title);
      expect(link.description.value).toBe(nextPreview.description);
      expect(link.siteName.value).toBe(nextPreview.siteName);
      expect(link.imageId.value).toBe(nextPreview.imageId);
      expect(link.background.value).toEqual({ type: "image", imageId: nextPreview.imageId });
    });

    test("leaves the link unchanged when no preview is available", async () => {
      const link = createLink();
      getMetadataMock.mockResolvedValue({ type: "LINK", url: nextUrl, preview: null });

      await expect(link.setUrl(nextUrl)).rejects.toThrow(LinkPreviewError);

      expect(link.url.value).toBe(LINK_PROPS.url);
      expect(link.title.value).toBe(LINK_PROPS.title);
      expect(link.imageId.value).toBe(LINK_PROPS.imageId);
    });

    test("clears the preview when one is not wanted", async () => {
      const link = createLink();

      await link.setUrl(nextUrl, { preview: false });

      expect(getMetadataMock).not.toHaveBeenCalled();
      expect(link.url.value).toBe(nextUrl);
      expect(link.title.value).toBeNull();
      expect(link.description.value).toBeNull();
      expect(link.siteName.value).toBeNull();
      expect(link.imageId.value).toBeNull();
      expect(link.background.value).toBeNull();
    });
  });
});
