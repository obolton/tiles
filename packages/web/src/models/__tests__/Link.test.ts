import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import Link from "@/models/Link";
import Video from "@/models/Video";
import { createEditor } from "@/test/editor";
import { PAGE } from "@/test/fixtures/Page";
import client from "@/api/client";
import { showToast } from "@/utils/toasts";
import type Editor from "@/editor/Editor";

vi.mock("@/collaboration/PageCollaboration", () => import("@/test/mocks/PageCollaboration"));

vi.mock("@/utils/toasts");

const LINK_PROPS = {
  url: "https://tiles.dev",
  title: "Link title",
  description: "Link description",
  siteName: "Test",
  imageId: "image-id",
};

const LINK_METADATA = { type: "LINK" as const, ...LINK_PROPS, previewAvailable: true };

const UNAVAILABLE_METADATA = {
  type: "LINK" as const,
  url: "https://tiles.dev/missing",
  title: null,
  description: null,
  siteName: null,
  imageId: null,
  previewAvailable: false,
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
    vi.mocked(showToast).mockClear();
  });

  function createLink(props: Parameters<typeof Link.createMap>[0] = LINK_PROPS): Link {
    return editor.page.createTile(Link.createMap(props), {}) as Link;
  }

  test("maps properties to reactive values", () => {
    const link = createLink();

    expect(link.url.value).toBe(LINK_PROPS.url);
    expect(link.title.value).toBe(LINK_PROPS.title);
    expect(link.description.value).toBe(LINK_PROPS.description);
    expect(link.siteName.value).toBe(LINK_PROPS.siteName);
    expect(link.imageId.value).toBe(LINK_PROPS.imageId);
  });

  describe("displayTitle", () => {
    test("uses the title when there is one", () => {
      const link = createLink();

      expect(link.displayTitle.value).toBe(LINK_PROPS.title);
    });

    test("falls back to the hostname when there is no title", () => {
      const link = createLink({ ...LINK_PROPS, url: "https://tiles.dev/some/page", title: null });

      expect(link.displayTitle.value).toBe("tiles.dev");
    });

    test("falls back to the raw URL when it cannot be parsed", () => {
      const link = createLink({ ...LINK_PROPS, url: "not a url", title: null });

      expect(link.displayTitle.value).toBe("not a url");
    });
  });

  describe("create", () => {
    test("creates a link card with the resolved metadata", async () => {
      const url = "https://tiles.dev";
      getMetadataMock.mockResolvedValue(LINK_METADATA);

      const link = await Link.create(editor.page, { url, width: 8, height: 6 });

      expect(getMetadataMock).toHaveBeenCalledWith({ pageId: PAGE.id, url });
      expect(link).toBeInstanceOf(Link);
      expect(link.title.value).toBe(LINK_PROPS.title);
      expect(link.width.value).toBe(8);
      expect(link.height.value).toBe(6);
      expect(showToast).not.toHaveBeenCalled();
    });

    test("defaults to a small custom-sized card", async () => {
      getMetadataMock.mockResolvedValue(LINK_METADATA);

      const link = await Link.create(editor.page, { url: "https://tiles.dev" });

      expect(link.sizing.value).toBe("CUSTOM");
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

    test("still creates the card and shows a toast when no preview is available", async () => {
      getMetadataMock.mockResolvedValue(UNAVAILABLE_METADATA);

      const link = await Link.create(editor.page, { url: UNAVAILABLE_METADATA.url });

      expect(link).toBeInstanceOf(Link);
      expect(link.title.value).toBeNull();
      expect(showToast).toHaveBeenCalledWith("Couldn't load a preview for this link.", "error");
    });
  });

  describe("setUrl", () => {
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
        previewAvailable: true,
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
      expect(showToast).not.toHaveBeenCalled();
    });

    test("shows a toast when the new link has no preview", async () => {
      const link = createLink();
      getMetadataMock.mockResolvedValue(UNAVAILABLE_METADATA);

      await link.setUrl(UNAVAILABLE_METADATA.url);

      expect(link.url.value).toBe(UNAVAILABLE_METADATA.url);
      expect(link.displayTitle.value).toBe("tiles.dev");
      expect(showToast).toHaveBeenCalledWith("Couldn't load a preview for this link.", "error");
    });
  });
});
