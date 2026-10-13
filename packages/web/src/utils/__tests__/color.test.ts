import { describe, expect, test } from "vitest";
import {
  formatColor,
  getColorName,
  getComplementaryColor,
  getHueName,
  getLightnessName,
  isSameColor,
  oklchToP3,
  p3ToOklch,
  parseColor,
  toCSSColor,
  type Color,
  type OklchColor,
  type P3Color,
} from "../color";

describe("parseColor", () => {
  test("parses 8-bit channel colors", () => {
    const { r, g, b } = parseColor("0ff080");
    expect(r).toBeCloseTo(0x0f / 0xff, 6);
    expect(g).toBeCloseTo(0xf0 / 0xff, 6);
    expect(b).toBeCloseTo(0x80 / 0xff, 6);
  });

  test("parses 16-bit channel colors", () => {
    const { r, g, b } = parseColor("1234cdef9999");
    expect(r).toBeCloseTo(0x1234 / 0xffff, 6);
    expect(g).toBeCloseTo(0xcdef / 0xffff, 6);
    expect(b).toBeCloseTo(0x9999 / 0xffff, 6);
  });

  test("throws on invalid length", () => {
    expect(() => parseColor("fff")).toThrow("Invalid color");
  });
});

describe("formatColor", () => {
  test("serializes 8-bit channel colors", () => {
    const color: P3Color = {
      r: 0x12 / 0xff,
      g: 0x34 / 0xff,
      b: 0x56 / 0xff,
    };
    expect(formatColor(color, 8)).toBe("123456");
  });

  test("serializes 16-bit channel colors", () => {
    const color: P3Color = {
      r: 0x1234 / 0xffff,
      g: 0xcdef / 0xffff,
      b: 0x9999 / 0xffff,
    };
    expect(formatColor(color, 16)).toBe("1234cdef9999");
  });

  test("rounds channel values before hex conversion", () => {
    const formatted = formatColor({ r: 0.5, g: 0.25, b: 0.125 }, 8);
    expect(formatted).toBe("804020");
  });

  test("clamps channel values into range", () => {
    expect(formatColor({ r: 2, g: -1, b: 0.5 }, 8)).toBe("ff0080");
  });
});

describe("toCSSColor", () => {
  test("formats components to four decimal places", () => {
    expect(toCSSColor("0ff080")).toBe("color(display-p3 0.0588 0.9412 0.5020)");
  });

  test("accepts direct P3 color objects", () => {
    const color: P3Color = { r: 0.1234, g: 0.5678, b: 0.9012 };
    expect(toCSSColor(color)).toBe("color(display-p3 0.1234 0.5678 0.9012)");
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

describe("oklchToP3", () => {
  test("converts OKLCH to P3", () => {
    const oklch: OklchColor = { l: 0.7, c: 0.15, h: 150 };
    const p3 = oklchToP3(oklch);
    expect(p3.r).toBeCloseTo(0.42, 1);
    expect(p3.g).toBeCloseTo(0.72, 1);
    expect(p3.b).toBeCloseTo(0.45, 1);
  });

  test("converts neutral gray", () => {
    const oklch: OklchColor = { l: 0.5, c: 0, h: 0 };
    const p3 = oklchToP3(oklch);
    expect(p3.r).toBeCloseTo(p3.g, 2);
    expect(p3.g).toBeCloseTo(p3.b, 2);
  });
});

describe("p3ToOklch", () => {
  test("converts P3 to OKLCH", () => {
    const p3: P3Color = { r: 1, g: 0, b: 0 };
    const oklch = p3ToOklch(p3);
    expect(oklch.l).toBeCloseTo(0.63, 1);
    expect(oklch.c).toBeCloseTo(0.26, 1);
    expect(oklch.h).toBeCloseTo(29, 0);
  });

  test("converts neutral gray", () => {
    const p3: P3Color = { r: 0.5, g: 0.5, b: 0.5 };
    const oklch = p3ToOklch(p3);
    expect(oklch.c).toBeCloseTo(0, 2);
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

describe("getComplementaryColor", () => {
  test("rotates hue by 180 degrees for saturated colors", () => {
    const color = formatColor(oklchToP3({ l: 0.6, c: 0.1, h: 30 }));
    const complementary = getComplementaryColor(color);
    const complementaryOklch = p3ToOklch(parseColor(complementary));

    expect(complementaryOklch.l).toBeCloseTo(0.6, 1);
    expect(complementaryOklch.c).toBeCloseTo(0.1, 1);
    expect(complementaryOklch.h).toBeCloseTo(210, 1);
  });

  test("wraps hue correctly when rotating past 360", () => {
    const color = formatColor(oklchToP3({ l: 0.6, c: 0.1, h: 270 }));
    const complementary = getComplementaryColor(color);
    const complementaryOklch = p3ToOklch(parseColor(complementary));

    expect(complementaryOklch.l).toBeCloseTo(0.6, 1);
    expect(complementaryOklch.c).toBeCloseTo(0.1, 1);
    expect(complementaryOklch.h).toBeCloseTo(90, 1);
  });

  test("adds chroma and default hue for gray colors", () => {
    const gray = formatColor(oklchToP3({ l: 0.5, c: 0.01, h: 0 }));
    const complementary = getComplementaryColor(gray);
    const complementaryOklch = p3ToOklch(parseColor(complementary));

    expect(complementaryOklch.l).toBeCloseTo(0.5, 1);
    expect(complementaryOklch.c).toBeCloseTo(0.1, 1);
    expect(complementaryOklch.h).toBeCloseTo(200, 0);
  });

  test("preserves lightness", () => {
    const dark = formatColor(oklchToP3({ l: 0.3, c: 0.1, h: 120 }));
    const light = formatColor(oklchToP3({ l: 0.8, c: 0.1, h: 120 }));

    const darkComplementary = p3ToOklch(parseColor(getComplementaryColor(dark)));
    const lightComplementary = p3ToOklch(parseColor(getComplementaryColor(light)));

    expect(darkComplementary.l).toBeCloseTo(0.3, 1);
    expect(lightComplementary.l).toBeCloseTo(0.8, 1);
  });
});
