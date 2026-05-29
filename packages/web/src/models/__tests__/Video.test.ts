import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import Video, { type CreateVideoInput } from "@/models/Video";
import Editor from "@/editor/Editor";
import { PAGE } from "@/test/fixtures/Page";

const VIDEO_PROPS: Omit<CreateVideoInput, "parentId" | "beforeId"> = {
  videoType: "YOUTUBE",
  videoId: "abc123",
  title: "Sample video",
  description: "Video description",
  imageUrl: "https://tiles.dev/video.png",
};

describe("Video", () => {
  const editor = Editor.init(PAGE, new Y.Doc());

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

  test("serialize", () => {
    const video = createVideo();
    const data = video.serialize();

    expect(data.type).toBe("VIDEO");
    expect(data.videoType).toBe(VIDEO_PROPS.videoType);
    expect(data.videoId).toBe(VIDEO_PROPS.videoId);
    expect(data.imageUrl).toBe(VIDEO_PROPS.imageUrl);
    expect(data.description).toBe(VIDEO_PROPS.description);
    expect(data.title).toBe(VIDEO_PROPS.title);
  });
});
