import { describe, expect, test } from "vitest";
import { getVideoInfo } from "../videos.ts";

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
