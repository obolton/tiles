import { beforeEach, describe, expect, test } from "vitest";
import Video, { type CreateVideoInput } from "@/models/Video";
import { createEditor } from "@/test/editor";
import type Editor from "@/editor/Editor";

const VIDEO_PROPS: Omit<CreateVideoInput, "parentId" | "beforeId"> = {
  videoType: "YOUTUBE",
  videoId: "abc123",
  title: "Sample video",
  description: "Video description",
  imageUrl: "https://tiles.dev/video.png",
};

describe("Video", () => {
  let editor: Editor;

  beforeEach(() => {
    editor = createEditor();
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
});
