import { describe, test, expect } from "vitest";
import { getDimensions } from "../schema";

describe("getDimensions", () => {
  test("returns 12x10 for small", () => {
    expect(getDimensions("small")).toEqual({ width: 12, height: 10 });
  });

  test("returns 24x15 for medium", () => {
    expect(getDimensions("medium")).toEqual({ width: 24, height: 15 });
  });

  test("returns 24x20 for large", () => {
    expect(getDimensions("large")).toEqual({ width: 24, height: 20 });
  });
});
