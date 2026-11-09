import { describe, test, expect, vi, beforeEach } from "vitest";
import { getLinkMetadata } from "@/utils/linkMetadata";
import { fetchImage } from "@/utils/fetchImage";
import { getVideoInfo } from "@/utils/videos";
import { resolveLinkMetadata } from "../links";
import type { AuthenticatedPageProcedureContext } from "@/utils/middleware";

vi.mock("@/utils/linkMetadata", () => ({
  getLinkMetadata: vi.fn(),
}));

vi.mock("@/utils/fetchImage", () => ({
  fetchImage: vi.fn(),
}));

vi.mock("@/utils/videos", () => ({
  getVideoInfo: vi.fn(),
}));

const MOCK_CONTEXT: AuthenticatedPageProcedureContext = {
  res: {} as AuthenticatedPageProcedureContext["res"],
  sessionId: "session-1",
  userId: "user-1",
  isService: false,
  pageId: "page-1",
  workspaceId: "workspace-1",
  pageType: "LAYOUT",
};

const MOCK_METADATA = {
  title: "Example",
  description: "An example page",
  siteName: "Example Site",
  imageUrl: "https://example.com/image.png",
};

const INPUT = { pageId: "page-1", url: "https://example.com/" };

beforeEach(() => {
  vi.mocked(getVideoInfo).mockReturnValue(null);
  vi.mocked(getLinkMetadata).mockResolvedValue(MOCK_METADATA);
  vi.mocked(fetchImage).mockResolvedValue("image-1");
});

describe("resolveLinkMetadata", () => {
  describe("for a video URL", () => {
    const VIDEO_INPUT = { pageId: "page-1", url: "https://www.youtube.com/watch?v=abc123" };

    beforeEach(() => {
      vi.mocked(getVideoInfo).mockReturnValue({ videoType: "YOUTUBE", videoId: "abc123" });
    });

    test("returns the video details with its page metadata", async () => {
      const result = await resolveLinkMetadata(VIDEO_INPUT, MOCK_CONTEXT);

      expect(result).toEqual({
        type: "VIDEO",
        videoType: "YOUTUBE",
        videoId: "abc123",
        title: "Example",
        description: "An example page",
        imageUrl: "https://example.com/image.png",
      });
    });

    test("does not fetch the image", async () => {
      await resolveLinkMetadata(VIDEO_INPUT, MOCK_CONTEXT);

      expect(fetchImage).not.toHaveBeenCalled();
    });

    test("falls back to an empty title when no metadata is available", async () => {
      vi.mocked(getLinkMetadata).mockResolvedValue(null);

      const result = await resolveLinkMetadata(VIDEO_INPUT, MOCK_CONTEXT);

      expect(result).toEqual({
        type: "VIDEO",
        videoType: "YOUTUBE",
        videoId: "abc123",
        title: "",
        description: null,
        imageUrl: null,
      });
    });
  });

  describe("for a regular link", () => {
    test("returns the link metadata with the fetched image", async () => {
      const result = await resolveLinkMetadata(INPUT, MOCK_CONTEXT);

      expect(result).toEqual({
        type: "LINK",
        url: "https://example.com/",
        title: "Example",
        description: "An example page",
        siteName: "Example Site",
        imageId: "image-1",
      });
    });

    test("fetches the image into the current workspace for the current user", async () => {
      await resolveLinkMetadata(INPUT, MOCK_CONTEXT);

      expect(fetchImage).toHaveBeenCalledWith(
        "https://example.com/image.png",
        "workspace-1",
        "user-1",
      );
    });

    test("returns a null image id when the image cannot be fetched", async () => {
      vi.mocked(fetchImage).mockResolvedValue(null);

      const result = await resolveLinkMetadata(INPUT, MOCK_CONTEXT);

      expect(result).toMatchObject({ type: "LINK", imageId: null });
    });

    test("does not fetch an image when the metadata has no image URL", async () => {
      vi.mocked(getLinkMetadata).mockResolvedValue({ ...MOCK_METADATA, imageUrl: null });

      const result = await resolveLinkMetadata(INPUT, MOCK_CONTEXT);

      expect(fetchImage).not.toHaveBeenCalled();
      expect(result).toMatchObject({ type: "LINK", imageId: null });
    });

    test("returns null fields when no metadata is available", async () => {
      vi.mocked(getLinkMetadata).mockResolvedValue(null);

      const result = await resolveLinkMetadata(INPUT, MOCK_CONTEXT);

      expect(fetchImage).not.toHaveBeenCalled();
      expect(result).toEqual({
        type: "LINK",
        url: "https://example.com/",
        title: null,
        description: null,
        siteName: null,
        imageId: null,
      });
    });
  });
});
