import { describe, test, expect, vi, beforeEach } from "vitest";
import { getLinkMetadata } from "@/utils/linkMetadata";
import { getVideoInfo } from "@/utils/videos";
import { resolveVideoMetadata } from "../videos";

vi.mock("@/utils/linkMetadata", () => ({
  getLinkMetadata: vi.fn(),
}));

vi.mock("@/utils/videos", () => ({
  getVideoInfo: vi.fn(),
}));

const MOCK_METADATA = {
  title: "Example",
  description: "An example page",
  siteName: "Example Site",
  imageUrl: "https://example.com/image.png",
};

const INPUT = { pageId: "page-1", url: "https://youtu.be/abc123" };

beforeEach(() => {
  vi.mocked(getVideoInfo).mockReturnValue(null);
  vi.mocked(getLinkMetadata).mockResolvedValue(MOCK_METADATA);
});

describe("resolveVideoMetadata", () => {
  test("returns the video details with its page metadata", async () => {
    vi.mocked(getVideoInfo).mockReturnValue({ videoType: "YOUTUBE", videoId: "abc123" });

    const result = await resolveVideoMetadata(INPUT);

    expect(getLinkMetadata).toHaveBeenCalledWith(INPUT.url);
    expect(result).toEqual({
      type: "VIDEO",
      videoType: "YOUTUBE",
      videoId: "abc123",
      title: "Example",
      description: "An example page",
      imageUrl: "https://example.com/image.png",
    });
  });

  test("falls back to an empty title when no metadata is available", async () => {
    vi.mocked(getVideoInfo).mockReturnValue({ videoType: "VIMEO", videoId: "123" });
    vi.mocked(getLinkMetadata).mockResolvedValue(null);

    const result = await resolveVideoMetadata(INPUT);

    expect(result).toEqual({
      type: "VIDEO",
      videoType: "VIMEO",
      videoId: "123",
      title: "",
      description: null,
      imageUrl: null,
    });
  });

  test("returns null without fetching metadata for a non-video URL", async () => {
    const result = await resolveVideoMetadata({ pageId: "page-1", url: "https://example.com/" });

    expect(result).toBeNull();
    expect(getLinkMetadata).not.toHaveBeenCalled();
  });
});
