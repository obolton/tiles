import { describe, expect, test } from "vitest";
import { getBackgroundProperties } from "../themes.ts";

describe("getBackgroundProperties", () => {
  test("returns undefined if the input is undefined", () => {
    expect(getBackgroundProperties(undefined)).toBeUndefined();
  });

  test("returns a null background", () => {
    expect(getBackgroundProperties(null)).toEqual({
      backgroundColor: null,
      backgroundGradient: null,
      backgroundImageId: null,
    });
  });

  test("returns a color background", () => {
    expect(
      getBackgroundProperties({
        type: "color",
        color: "ff00ff00ff00",
      }),
    ).toEqual({
      backgroundColor: new Uint8Array([255, 0, 255, 0, 255, 0]),
      backgroundGradient: null,
    });
  });

  test("returns a gradient background", () => {
    expect(
      getBackgroundProperties({
        type: "gradient",
        colorA: "ff00ff00ff00",
        colorB: "00ff0000ff00",
        direction: "VERTICAL",
      }),
    ).toEqual({
      backgroundColor: new Uint8Array([255, 0, 255, 0, 255, 0, 0, 255, 0, 0, 255, 0]),
      backgroundGradient: "VERTICAL",
    });
  });

  test("returns an image background", () => {
    expect(
      getBackgroundProperties({
        type: "image",
        imageId: "test",
      }),
    ).toEqual({
      backgroundColor: null,
      backgroundGradient: null,
      backgroundImageId: "test",
    });
  });
});
