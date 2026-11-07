import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import Video, { UnsupportedVideoError, type VideoMetadata } from "@/models/Video";
import { createEditor } from "@/test/editor";
import { PAGE } from "@/test/fixtures/Page";
import client from "@/api/client";
import type Editor from "@/editor/Editor";
import type { VideoMapInput } from "doc/tiles/video";

vi.mock("@/collaboration/PageCollaboration", () => import("@/test/mocks/PageCollaboration"));

vi.mock("@/api/client", () => ({
  default: {
    videos: {
      getMetadata: {
        query: vi.fn(),
      },
    },
  },
}));

const VIDEO_PROPS: Omit<VideoMapInput, "parentId" | "beforeId"> = {
  videoType: "YOUTUBE",
  videoId: "abc123",
  title: "Sample video",
  description: "Video description",
  imageUrl: "https://tiles.dev/video.png",
};

const VIDEO_METADATA: VideoMetadata = {
  type: "VIDEO",
  videoType: "VIMEO",
  videoId: "123456",
  title: "Vimeo video",
  description: null,
  imageUrl: "https://tiles.dev/vimeo.png",
};

describe("Video", () => {
  const getMetadataMock = vi.mocked(client.videos.getMetadata.query);
  let editor: Editor;

  beforeEach(() => {
    editor = createEditor();
  });

  afterEach(() => {
    getMetadataMock.mockReset();
  });

  function createVideo() {
    const map = Video.createMap(VIDEO_PROPS);
    return editor.page.createTile(map, {}) as Video;
  }

  test("maps properties to reactive values", () => {
    const video = createVideo();

    expect(video.type).toBe("VIDEO");
    expect(video.videoType.value).toBe(VIDEO_PROPS.videoType);
    expect(video.videoId.value).toBe(VIDEO_PROPS.videoId);
    expect(video.imageUrl.value).toBe(VIDEO_PROPS.imageUrl);
    expect(video.description.value).toBe(VIDEO_PROPS.description);
    expect(video.title.value).toBe(VIDEO_PROPS.title);
  });

  describe("create", () => {
    test("creates a video tile from the resolved metadata", async () => {
      getMetadataMock.mockResolvedValue(VIDEO_METADATA);
      const url = "https://vimeo.com/123456";

      const video = await Video.create(editor.page, { url });

      expect(getMetadataMock).toHaveBeenCalledWith({ pageId: PAGE.id, url });
      expect(editor.page.getTile(video.id)).toBe(video);
      expect(video.videoType.value).toBe("VIMEO");
      expect(video.videoId.value).toBe("123456");
      expect(video.title.value).toBe("Vimeo video");
      expect(video.imageUrl.value).toBe(VIDEO_METADATA.imageUrl);
      expect(video.sizing.value).toBe("LANDSCAPE");
    });

    test("rejects a URL that does not resolve to a video", async () => {
      getMetadataMock.mockResolvedValue(null);

      await expect(Video.create(editor.page, { url: "https://tiles.dev" })).rejects.toThrow(
        UnsupportedVideoError,
      );
      expect(editor.page.tiles.value).toHaveLength(0);
    });
  });
});
