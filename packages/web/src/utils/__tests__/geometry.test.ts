import { describe, expect, test, vi } from "vitest";
import { getCenter, getOffsetCenter, getDistance } from "../geometry";

describe("getCenter", () => {
  test("returns the center of the rectangle", () => {
    const rect = new DOMRect(10, 20, 100, 200);
    expect(getCenter(rect)).toEqual({ x: 60, y: 120 });
  });
});

describe("getOffsetCenter", () => {
  test("returns the offset center of the element", () => {
    const element = document.createElement("div");
    vi.spyOn(element, "offsetLeft", "get").mockReturnValue(10);
    vi.spyOn(element, "offsetTop", "get").mockReturnValue(20);
    vi.spyOn(element, "offsetWidth", "get").mockReturnValue(100);
    vi.spyOn(element, "offsetHeight", "get").mockReturnValue(200);

    expect(getOffsetCenter(element)).toEqual({ x: 60, y: 120 });
  });
});

describe("getDistance", () => {
  test("returns the distance between two points", () => {
    const a = new DOMPoint(10, 20);
    const b = new DOMPoint(13, 24);
    expect(getDistance(a, b)).toBe(5);
  });
});
