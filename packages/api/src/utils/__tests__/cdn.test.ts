import { describe, expect, test } from "vitest";
import { getProfileImageUrl } from "../cdn";

describe("getProfileImageUrl", () => {
  test("returns the profile image URL", () => {
    const result = getProfileImageUrl("image-key");
    expect(result).toBe("https://example.com/profile-images/image-key?optimizer=image&class=small");
  });
});
