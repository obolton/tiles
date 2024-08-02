import { describe, expect, test } from "vitest";
import { getImageUrl, getMapImageUrl } from "../images";

describe("getImageUrl", () => {
  test("returns the URL of the image", () => {
    expect(getImageUrl("test.jpg")).toBe(
      `${import.meta.env.PUBLIC_IMAGES_BASE_URL}/test.jpg?optimizer=image&class=large`,
    );
  });
});

describe("getMapImageUrl", () => {
  test("returns the URL of the map image", () => {
    expect(getMapImageUrl("test.jpg")).toBe(
      `${import.meta.env.PUBLIC_MAPS_BASE_URL}/test.jpg`,
    );
  });
});
