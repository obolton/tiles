import { describe, test, expect } from "vitest";
import { getUserColor } from "../userColor";

describe("getUserColor", () => {
  test("returns the same color for the same index", () => {
    expect(getUserColor(0)).toBe(getUserColor(0));
    expect(getUserColor(7)).toBe(getUserColor(7));
  });

  test("returns an oklch color string", () => {
    expect(getUserColor(0)).toBe("oklch(0.7 0.15 0.000)");
    expect(getUserColor(1)).toBe("oklch(0.7 0.15 137.508)");
  });

  test("returns distinct colors for the first many participants", () => {
    const colors = new Set<string>();
    for (let i = 0; i < 20; i++) {
      colors.add(getUserColor(i));
    }
    expect(colors.size).toBe(20);
  });
});
