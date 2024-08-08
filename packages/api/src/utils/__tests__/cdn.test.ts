import { describe, expect, test } from "vitest";
import {
  getProfileImageUrl,
  getLinkImageUrl,
  getVideoImageUrl,
} from "../cdn.ts";

describe("getProfileImageUrl", () => {
  test("returns the profile image URL", () => {
    const result = getProfileImageUrl("image-key");
    expect(result).toEqual("https://example.com/profile-images/image-key");
  });
});

describe("getLinkImageUrl", () => {
  test("returns the link image URL", () => {
    const result = getLinkImageUrl("link-tile-id");
    expect(result).toEqual("https://example.com/resources/links/link-tile-id");
  });
});

describe("getVideoImageUrl", () => {
  test("returns the video image URL", () => {
    const result = getVideoImageUrl("link-tile-id");
    expect(result).toEqual("https://example.com/resources/videos/link-tile-id");
  });
});
