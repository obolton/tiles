import { describe, expect, test } from "vitest";
import { getProfileImageUrl, getVideoImageUrl } from "../cdn.ts";

describe("getProfileImageUrl", () => {
  test("returns the profile image URL", () => {
    const result = getProfileImageUrl("image-key");
    expect(result).toEqual(
      "https://example.com/profile-images/image-key?optimizer=image&class=small",
    );
  });
});

describe("getVideoImageUrl", () => {
  test("returns the video image URL", () => {
    const result = getVideoImageUrl("link-tile-id");
    expect(result).toEqual("https://example.com/resources/videos/link-tile-id");
  });
});
