import { describe, expect, test } from "vitest";
import { getVideoInfo } from "../videos";

describe("getVideoInfo", () => {
  test.each(["", "invalid"])("throws an error for invalid URL: %s", (url) => {
    expect(() => getVideoInfo(url)).toThrow("Invalid URL");
  });

  test.each([
    "https://www.youtube.com/other-path?v=abc",
    "https://www.youtube.com/playlist?list=xyz",
    "https://www.youtube.com/@channel",
    "ftp://www.youtube.com/watch?v=abc",
    "https://test.com/watch?v=abc",
    "https://notyoutube.com/watch?v=abc",
    "https://vimeo.com/user123",
    "https://vimeo.com/",
    "https://example.com/",
  ])("returns null for a non-video URL: %s", (url) => {
    expect(getVideoInfo(url)).toBeNull();
  });

  describe("YouTube", () => {
    test.each([
      "https://www.youtube.com/watch?v=abc",
      "https://youtube.com/watch?v=abc",
      "http://www.youtube.com/watch?v=abc",
      "https://m.youtube.com/watch?v=abc",
      "https://music.youtube.com/watch?v=abc",
      "https://www.youtube.com/watch?t=10&v=abc&list=xyz",
      "https://youtu.be/abc",
      "https://youtu.be/abc?t=10",
      "https://www.youtube.com/embed/abc",
      "https://www.youtube-nocookie.com/embed/abc",
      "https://www.youtube.com/shorts/abc",
      "https://www.youtube.com/live/abc",
      "https://www.youtube.com/v/abc",
    ])("extracts the video ID from %s", (url) => {
      expect(getVideoInfo(url)).toEqual({ videoType: "YOUTUBE", videoId: "abc" });
    });

    test("accepts the characters used in video IDs", () => {
      expect(getVideoInfo("https://youtu.be/a-B_1")).toEqual({
        videoType: "YOUTUBE",
        videoId: "a-B_1",
      });
    });

    test.each([
      "https://www.youtube.com/watch",
      "https://www.youtube.com/watch?v=",
      "https://www.youtube.com/watch?list=xyz",
      "https://www.youtube.com/watch?v=abc%2Fdef",
      "https://youtu.be/",
      "https://www.youtube.com/embed/",
    ])("returns null when the video ID is missing or malformed: %s", (url) => {
      expect(getVideoInfo(url)).toBeNull();
    });
  });

  describe("Vimeo", () => {
    test.each([
      "https://vimeo.com/123456",
      "https://www.vimeo.com/123456",
      "https://vimeo.com/123456?share=copy",
      "https://vimeo.com/123456/abcdef1234",
      "https://vimeo.com/channels/staffpicks/123456",
      "https://vimeo.com/groups/name/videos/123456",
      "https://vimeo.com/showcase/987/video/123456",
      "https://player.vimeo.com/video/123456",
      "https://player.vimeo.com/video/123456?h=abcdef1234",
    ])("extracts the video ID from %s", (url) => {
      expect(getVideoInfo(url)).toEqual({ videoType: "VIMEO", videoId: "123456" });
    });

    test.each(["https://vimeo.com/abc", "https://player.vimeo.com/video/"])(
      "returns null when the video ID is missing or malformed: %s",
      (url) => {
        expect(getVideoInfo(url)).toBeNull();
      },
    );
  });
});
