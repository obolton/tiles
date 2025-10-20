import { describe, expect, test } from "vitest";
import { getBackgroundProperties } from "../backgrounds.ts";

describe("getBackgroundProperties", () => {
  test("returns undefined if the input is undefined", () => {
    expect(getBackgroundProperties(undefined)).toBeUndefined();
  });

  test("returns a null background", () => {
    expect(getBackgroundProperties(null)).toEqual({
      backgroundL: null,
      backgroundC: null,
      backgroundH: null,
      backgroundImageId: null,
    });
  });

  test("returns a color background", () => {
    expect(
      getBackgroundProperties({
        type: "color",
        color: {
          l: 0.5,
          c: 0.4,
          h: 30,
        },
      }),
    ).toEqual({
      backgroundL: 0.5,
      backgroundC: 0.4,
      backgroundH: 30,
      backgroundImageId: null,
    });
  });

  test("returns an image background", () => {
    expect(
      getBackgroundProperties({
        type: "image",
        imageId: "test",
      }),
    ).toEqual({
      backgroundL: null,
      backgroundC: null,
      backgroundH: null,
      backgroundImageId: "test",
    });
  });
});
