import { describe, expect, test } from "vitest";
import { getImageUrl, getProfileImageUrl } from "../images";

describe("getImageUrl", () => {
  test("builds a CDN URL from the image ID", () => {
    expect(getImageUrl("00000000-0000-0000-0000-000000000001")).toBe(
      "https://images.test/00000000-0000-0000-0000-000000000001?optimizer=image&class=large",
    );
  });
});

describe("getProfileImageUrl", () => {
  test("builds a small-class CDN URL from the image key", () => {
    expect(getProfileImageUrl("user-1/avatar.png")).toBe(
      "https://profile-images.test/user-1/avatar.png?optimizer=image&class=small",
    );
  });
});
