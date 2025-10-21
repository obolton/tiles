import { describe, expect, test } from "vitest";
import {
  formatColor,
  getColorName,
  getHueName,
  getLightnessName,
  isDark,
  isSameColor,
  parseColor,
  toCSSColor,
  type Color,
  type OklchColor,
} from "../color";

describe("parseColor", () => {
  test("parses 8-bit channel colors", () => {
    const { l, c, h } = parseColor("0ff080");
    expect(l).toBeCloseTo(0x0f / 0xff, 6);
    expect(c).toBeCloseTo(0xf0 / 0xff, 6);
    expect(h).toBeCloseTo((0x80 / 0xff) * 360, 6);
  });

  test("parses 16-bit channel colors", () => {
    const { l, c, h } = parseColor("1234cdef9999");
    expect(l).toBeCloseTo(0x1234 / 0xffff, 6);
    expect(c).toBeCloseTo(0xcdef / 0xffff, 6);
    expect(h).toBeCloseTo(((0x9999 / 0xffff) * 360) % 360, 6);
  });

  test("throws on invalid length", () => {
    expect(() => parseColor("fff")).toThrowError("Invalid color");
  });
});

describe("formatColor", () => {
  test("serializes 8-bit channel colors", () => {
    const color: OklchColor = {
      l: 0x12 / 0xff,
      c: 0x34 / 0xff,
      h: (0x56 / 0xff) * 360,
    };
    expect(formatColor(color, 8)).toBe("123456");
  });

  test("serializes 16-bit channel colors", () => {
    const color: OklchColor = {
      l: 0x1234 / 0xffff,
      c: 0xcdef / 0xffff,
      h: (0x9999 / 0xffff) * 360,
    };
    expect(formatColor(color, 16)).toBe("1234cdef9999");
  });

  test("removes fractional parts before hex conversion", () => {
    const formatted = formatColor({ l: 0.5, c: 0.25, h: 1 }, 8);
    expect(formatted).toBe("7f3f00");
  });

  test("clamps channel values into range", () => {
    expect(formatColor({ l: 2, c: -1, h: 720 }, 8)).toBe("ff0000");
  });
});

describe("toCSSColor", () => {
  test("formats components to four decimal places", () => {
    expect(toCSSColor("0ff080")).toBe("oklch(0.0588 0.9412 180.7059deg)");
  });

  test("accepts direct OKLCH objects", () => {
    const color: OklchColor = { l: 0.1234, c: 0.9876, h: 45.6789 };
    expect(toCSSColor(color)).toBe("oklch(0.1234 0.9876 45.6789deg)");
  });
});

describe("isSameColor", () => {
  test("returns true when color strings match", () => {
    const color: Color = "0ff080";
    expect(isSameColor(color, "0ff080")).toBe(true);
  });

  test("returns false when color strings differ", () => {
    expect(isSameColor("0ff080", "0ff181")).toBe(false);
  });
});

describe("isDark", () => {
  test("uses the 0.5 threshold", () => {
    expect(isDark("7f0000")).toBe(true);
    expect(isDark("800000")).toBe(false);
  });
});

describe("getLightnessName", () => {
  test("maps lightness to descriptive buckets", () => {
    expect(getLightnessName(0.15)).toBe("Very Dark");
    expect(getLightnessName(0.45)).toBe("Dark");
    expect(getLightnessName(0.65)).toBe("Mid");
    expect(getLightnessName(0.85)).toBe("Light");
    expect(getLightnessName(0.95)).toBe("Very Light");
  });
});

describe("getHueName", () => {
  test("returns Gray when chroma is low", () => {
    expect(getHueName({ l: 0.6, c: 0.01, h: 210 })).toBe("Gray");
  });

  test("classifies hues into named ranges", () => {
    expect(getHueName({ l: 0.6, c: 0.3, h: 10 })).toBe("Red");
    expect(getHueName({ l: 0.6, c: 0.3, h: 140 })).toBe("Green");
    expect(getHueName({ l: 0.6, c: 0.3, h: 290 })).toBe("Violet");
  });

  test("wraps values greater than 360 degrees", () => {
    expect(getHueName({ l: 0.6, c: 0.3, h: 400 })).toBe("Orange");
  });

  test("returns Unknown for negative hues outside ranges", () => {
    expect(getHueName({ l: 0.6, c: 0.3, h: -15 })).toBe("Unknown");
  });
});

describe("getColorName", () => {
  test("labels white and black for neutral colors", () => {
    expect(getColorName({ l: 0.92, c: 0.01, h: 50 })).toBe("White");
    expect(getColorName({ l: 0.18, c: 0.01, h: 50 })).toBe("Black");
  });

  test("combines lightness and hue for saturated colors", () => {
    expect(getColorName({ l: 0.72, c: 0.2, h: 220 })).toBe("Light Blue");
    expect(getColorName({ l: 0.32, c: 0.2, h: 30 })).toBe("Dark Orange");
  });

  test("returns gray descriptor for mid neutral colors", () => {
    expect(getColorName({ l: 0.55, c: 0.03, h: 180 })).toBe("Mid Gray");
  });
});
