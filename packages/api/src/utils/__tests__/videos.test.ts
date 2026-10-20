import { describe, expect, test } from "vitest";
import { getVideoInfo } from "../videos";

describe("getVideoInfo", () => {
  test("returns video info for a valid YouTube URL", () => {
    expect(getVideoInfo("https://www.youtube.com/watch?v=abc")).toEqual({
      videoType: "YOUTUBE",
      videoId: "abc",
    });
  });

  test.each(["", "invalid"])("throws an error for invalid URL: %s", (url) => {
    expect(() => getVideoInfo(url)).toThrow("Invalid URL");
  });

  test.each([
    "https://www.youtube.com/other-path?v=abc",
    "ftp://www.youtube.com/watch?v=abc",
    "https://test.com/watch?v=abc",
  ])("returns null for non-video URLs: %s", (url) => {
    expect(getVideoInfo(url)).toBeNull();
  });
});

describe("getVideoInfo (YouTube variants)", () => {
  test.each([
    "https://youtube.com/watch?v=abc",
    "http://www.youtube.com/watch?v=abc",
    "https://www.youtube.com/watch?t=10&v=abc&list=xyz",
  ])("extracts the video ID from %s", (url) => {
    expect(getVideoInfo(url)).toEqual({ videoType: "YOUTUBE", videoId: "abc" });
  });

  test.each([
    "https://www.youtube.com/watch",
    "https://www.youtube.com/watch?v=",
    "https://www.youtube.com/watch?list=xyz",
  ])("returns null when the video ID is missing: %s", (url) => {
    expect(getVideoInfo(url)).toBeNull();
  });

  test.each([
    "https://youtu.be/abc",
    "https://m.youtube.com/watch?v=abc",
    "https://www.youtube.com/embed/abc",
    "https://www.youtube.com/shorts/abc",
  ])("returns null for unsupported YouTube URL formats: %s", (url) => {
    expect(getVideoInfo(url)).toBeNull();
  });
});
