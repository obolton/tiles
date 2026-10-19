import { describe, expect, test } from "vitest";
import { DEFAULT_FREEFORM_WIDTH, getFreeformPlacement } from "../freeform";

describe("getFreeformPlacement", () => {
  test("centers a tile a third of the section width by default", () => {
    const placement = getFreeformPlacement(16 / 9, 16 / 9);

    expect(placement.width).toBeCloseTo(DEFAULT_FREEFORM_WIDTH);
    expect(placement.height).toBeCloseTo(DEFAULT_FREEFORM_WIDTH);
    expect(placement.x).toBeCloseTo((100 - placement.width) / 2);
    expect(placement.y).toBeCloseTo((100 - placement.height) / 2);
  });

  test("derives the height from the section and content aspect ratios", () => {
    const placement = getFreeformPlacement(2, 1, 20);

    expect(placement.width).toBe(20);
    expect(placement.height).toBeCloseTo(40);
    expect(placement.x).toBe(40);
    expect(placement.y).toBe(30);
  });

  test("shrinks tall content to fit within the section", () => {
    const placement = getFreeformPlacement(16 / 9, 9 / 16);

    expect(placement.height).toBe(60);
    expect(placement.width).toBeCloseTo((60 * 9) / 16 / (16 / 9));
    expect(placement.y).toBe(20);
    expect(placement.x).toBeCloseTo((100 - placement.width) / 2);
  });

  test("accepts a custom width", () => {
    const placement = getFreeformPlacement(4 / 3, 2, 50);

    expect(placement.width).toBe(50);
    expect(placement.height).toBeCloseTo((50 * 4) / 3 / 2);
    expect(placement.x).toBe(25);
  });
});
