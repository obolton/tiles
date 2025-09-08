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
      backgroundImageKey: null,
    });
  });

  test("returns a color background", () => {
    expect(
      getBackgroundProperties({
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
      backgroundImageKey: null,
    });
  });

  test("returns an image background", () => {
    expect(
      getBackgroundProperties({
        imageKey: "test",
      }),
    ).toEqual({
      backgroundL: null,
      backgroundC: null,
      backgroundH: null,
      backgroundImageKey: "test",
    });
  });
});
