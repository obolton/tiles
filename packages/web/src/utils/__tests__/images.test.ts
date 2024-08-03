import { describe, expect, test } from "vitest";
import { getImageUrl } from "../images";

describe("getImageUrl", () => {
  test("returns the URL of the image", () => {
    expect(getImageUrl("test.jpg")).toBe(
      `${import.meta.env.PUBLIC_IMAGES_BASE_URL}/test.jpg?optimizer=image&class=large`,
    );
  });
});
