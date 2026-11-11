import { describe, test, expect } from "vitest";
import { CoordinatesSchema, PositionXSchema, getDimensions } from "../schema";

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

describe("PositionXSchema", () => {
  test("accepts a percentage", () => {
    expect(PositionXSchema.safeParse(50).success).toBe(true);
  });

  test("rejects a value outside 0-100", () => {
    expect(PositionXSchema.safeParse(150).success).toBe(false);
  });
});

describe("CoordinatesSchema", () => {
  test("accepts valid coordinates", () => {
    expect(CoordinatesSchema.safeParse({ lat: 51.5, long: -0.1 }).success).toBe(true);
  });

  test("rejects an out-of-range latitude", () => {
    expect(CoordinatesSchema.safeParse({ lat: 120, long: 0 }).success).toBe(false);
  });
});
