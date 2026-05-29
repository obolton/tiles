import { describe, expect, test } from "vitest";
import { getImageUrl } from "../images";

describe("getImageUrl", () => {
  test("builds a CDN URL from the image ID", () => {
    expect(getImageUrl("00000000-0000-0000-0000-000000000001")).toBe(
      "https://images.test/00000000-0000-0000-0000-000000000001?optimizer=image&class=large",
    );
  });
});
