import { describe, expect, test } from "vitest";
import {
  getColorName,
  getHueName,
  getLightnessName,
  isDark,
  isSameColor,
  toCSSColor,
  type Color,
} from "../color";

describe("toCSSColor", () => {
  test("formats components to two decimal places", () => {
    const color: Color = { l: 0.1234, c: 0.9876, h: 45.6789 };
    expect(toCSSColor(color)).toBe("oklch(0.12 0.99 45.68deg)");
  });
});

describe("isSameColor", () => {
  test("returns true when every component matches", () => {
    const base: Color = { l: 0.4, c: 0.2, h: 180 };
    expect(isSameColor(base, { l: 0.4, c: 0.2, h: 180 })).toBe(true);
  });

  test("returns false when any component differs", () => {
    const base: Color = { l: 0.4, c: 0.2, h: 180 };
    expect(isSameColor(base, { l: 0.4, c: 0.2, h: 200 })).toBe(false);
  });
});

describe("isDark", () => {
  test("uses the 0.5 threshold", () => {
    expect(isDark({ l: 0.49, c: 0.1, h: 10 })).toBe(true);
    expect(isDark({ l: 0.5, c: 0.1, h: 10 })).toBe(false);
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
