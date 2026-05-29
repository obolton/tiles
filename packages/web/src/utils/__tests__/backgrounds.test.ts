import { describe, expect, test } from "vitest";
import { getBackgroundStyle } from "../backgrounds";
import { getImageUrl } from "../images";
import type { Fill } from "@/components/fills/types";

describe("getBackgroundStyle", () => {
  test("returns undefined for null", () => {
    expect(getBackgroundStyle(null)).toBeUndefined();
  });

  test("returns undefined for undefined", () => {
    expect(getBackgroundStyle(undefined)).toBeUndefined();
  });

  describe("color backgrounds", () => {
    test("returns background with CSS color value", () => {
      const background: Fill = { type: "color", color: "80000a000000" };
      const result = getBackgroundStyle(background);
      expect(result).toEqual({
        background: "color(display-p3 0.5000 0.0391 0.0000)",
      });
    });
  });

  describe("gradient backgrounds", () => {
    const colorA = "80000a000000";
    const colorB = "c000148000b4";

    test("returns vertical gradient", () => {
      const background: Fill = {
        type: "gradient",
        colorA,
        colorB,
        direction: "VERTICAL",
      };
      const result = getBackgroundStyle(background);
      expect(result?.background).toContain("linear-gradient(to bottom");
      expect(result?.background).toContain("in oklch");
    });

    test("returns horizontal gradient", () => {
      const background: Fill = {
        type: "gradient",
        colorA,
        colorB,
        direction: "HORIZONTAL",
      };
      const result = getBackgroundStyle(background);
      expect(result?.background).toContain("linear-gradient(to right");
    });

    test("returns bottom-right diagonal gradient", () => {
      const background: Fill = {
        type: "gradient",
        colorA,
        colorB,
        direction: "BOTTOM_RIGHT",
      };
      const result = getBackgroundStyle(background);
      expect(result?.background).toContain("linear-gradient(to bottom right");
    });

    test("returns bottom-left diagonal gradient", () => {
      const background: Fill = {
        type: "gradient",
        colorA,
        colorB,
        direction: "BOTTOM_LEFT",
      };
      const result = getBackgroundStyle(background);
      expect(result?.background).toContain("linear-gradient(to bottom left");
    });
  });

  describe("image backgrounds", () => {
    test("returns background", () => {
      const imageId = "00000000-0000-0000-0000-000000000001";
      const background: Fill = { type: "image", imageId };
      const result = getBackgroundStyle(background);
      expect(result).toEqual({
        background: `url(${getImageUrl(imageId)}) center / cover`,
      });
    });
  });
});
