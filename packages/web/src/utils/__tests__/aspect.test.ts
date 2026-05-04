import { describe, expect, test } from "vitest";
import { getAspect } from "../aspect";

describe("getAspect", () => {
  test("returns 16/9 for LANDSCAPE", () => {
    expect(getAspect("LANDSCAPE", null, 0)).toBeCloseTo(16 / 9);
  });

  test("returns 9/16 for PORTRAIT", () => {
    expect(getAspect("PORTRAIT", null, 0)).toBeCloseTo(9 / 16);
  });

  test("returns 1 for SQUARE", () => {
    expect(getAspect("SQUARE", null, 0)).toBe(1);
  });

  test("returns 4/3 for FOUR_THREE", () => {
    expect(getAspect("FOUR_THREE", null, 0)).toBeCloseTo(4 / 3);
  });

  test("returns 3/4 for THREE_FOUR", () => {
    expect(getAspect("THREE_FOUR", null, 0)).toBeCloseTo(3 / 4);
  });

  test("computes ratio from width and height for CUSTOM", () => {
    expect(getAspect("CUSTOM", 32, 18)).toBeCloseTo(32 / 18);
  });

  test("computes ratio from width and height for AUTO", () => {
    expect(getAspect("AUTO", 20, 10)).toBeCloseTo(2);
  });

  test("falls back to 16/9 when AUTO has null width", () => {
    expect(getAspect("AUTO", null, 10)).toBeCloseTo(16 / 9);
  });

  test("falls back to 16/9 when CUSTOM has zero height", () => {
    expect(getAspect("CUSTOM", 16, 0)).toBeCloseTo(16 / 9);
  });
});
