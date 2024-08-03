import { describe, expect, test } from "vitest";
import { getProfileImageUrl, getLinkImageUrl } from "../cdn.ts";

describe("getProfileImageUrl", () => {
  test("returns the profile image URL", () => {
    const result = getProfileImageUrl("image-key");
    expect(result).toEqual("https://example.com/profile-images/image-key");
  });
});

describe("getLinkImageUrl", () => {
  test("returns the link image URL", () => {
    const result = getLinkImageUrl("link-tile-id");
    expect(result).toEqual("https://example.com/link-images/link-tile-id");
  });
});
