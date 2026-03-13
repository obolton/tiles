import { afterEach, describe, expect, test, vi } from "vitest";
import Video from "@/models/Video";
import Editor from "@/editor/Editor";
import client from "@/api/client";
import { PAGE } from "@/test/fixtures/Page";
import { VIDEO_TILE } from "@/test/fixtures/Tile";

vi.mock("@/api/client", () => ({
  default: {
    videos: {
      update: {
        mutate: vi.fn(),
      },
    },
  },
}));

describe("Video", () => {
  const editor = Editor.init(PAGE);
  const updateMock = vi.mocked(client.videos.update.mutate);

  afterEach(() => {
    updateMock.mockReset();
  });

  test("serialize", () => {
    const data = { ...VIDEO_TILE, sectionId: null };
    const video = new Video(editor.page, data);

    expect(video.serialize()).toEqual(data);
  });

  test("maps properties to reactive values", () => {
    const video = new Video(editor.page, VIDEO_TILE);

    expect(video.type).toBe("VIDEO");
    expect(video.videoType).toBe(VIDEO_TILE.videoType);
    expect(video.videoId).toBe(VIDEO_TILE.videoId);
    expect(video.imageUrl).toBe(VIDEO_TILE.imageUrl);
    expect(video.title.value).toBe(VIDEO_TILE.title);
  });

  describe("setTitle", () => {
    test("updates the title and persists it", async () => {
      const video = new Video(editor.page, VIDEO_TILE);
      const title = "Updated title";

      await video.setTitle(title);

      expect(video.title.value).toBe(title);
      expect(updateMock).toHaveBeenCalledWith({
        pageId: PAGE.id,
        id: VIDEO_TILE.id,
        title,
      });
    });
  });
});
