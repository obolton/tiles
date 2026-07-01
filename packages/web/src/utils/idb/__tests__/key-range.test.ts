import { describe, expect, test } from "vitest";
import { keyRange } from "../key-range";

describe("keyRange", () => {
  describe("lower bound only", () => {
    test("creates a lower bound range", () => {
      const range = keyRange({ lower: 10 });
      expect(range.lower).toBe(10);
      expect(range.lowerOpen).toBe(false);
      expect(range.upper).toBeUndefined();
    });

    test("creates an open lower bound range", () => {
      const range = keyRange({ lower: 10, lowerOpen: true });
      expect(range.lower).toBe(10);
      expect(range.lowerOpen).toBe(true);
    });
  });

  describe("upper bound only", () => {
    test("creates an upper bound range", () => {
      const range = keyRange({ upper: 20 });
      expect(range.upper).toBe(20);
      expect(range.upperOpen).toBe(false);
      expect(range.lower).toBeUndefined();
    });

    test("creates an open upper bound range", () => {
      const range = keyRange({ upper: 20, upperOpen: true });
      expect(range.upper).toBe(20);
      expect(range.upperOpen).toBe(true);
    });
  });

  describe("bounded range", () => {
    test("creates a bounded range", () => {
      const range = keyRange({ lower: 10, upper: 20 });
      expect(range.lower).toBe(10);
      expect(range.upper).toBe(20);
      expect(range.lowerOpen).toBe(false);
      expect(range.upperOpen).toBe(false);
    });

    test("creates a bounded range with open bounds", () => {
      const range = keyRange({
        lower: 10,
        upper: 20,
        lowerOpen: true,
        upperOpen: true,
      });
      expect(range.lower).toBe(10);
      expect(range.upper).toBe(20);
      expect(range.lowerOpen).toBe(true);
      expect(range.upperOpen).toBe(true);
    });
  });

  describe("error handling", () => {
    test("throws if no bounds are provided", () => {
      expect(() => keyRange({})).toThrow("keyRange requires at least a lower or upper bound");
    });
  });

  describe("includes", () => {
    test("lower bound includes values >= lower", () => {
      const range = keyRange({ lower: 10 });
      expect(range.includes(10)).toBe(true);
      expect(range.includes(15)).toBe(true);
      expect(range.includes(9)).toBe(false);
    });

    test("open lower bound excludes the bound value", () => {
      const range = keyRange({ lower: 10, lowerOpen: true });
      expect(range.includes(10)).toBe(false);
      expect(range.includes(11)).toBe(true);
    });

    test("upper bound includes values <= upper", () => {
      const range = keyRange({ upper: 20 });
      expect(range.includes(20)).toBe(true);
      expect(range.includes(15)).toBe(true);
      expect(range.includes(21)).toBe(false);
    });

    test("open upper bound excludes the bound value", () => {
      const range = keyRange({ upper: 20, upperOpen: true });
      expect(range.includes(20)).toBe(false);
      expect(range.includes(19)).toBe(true);
    });

    test("bounded range includes values within bounds", () => {
      const range = keyRange({ lower: 10, upper: 20 });
      expect(range.includes(10)).toBe(true);
      expect(range.includes(15)).toBe(true);
      expect(range.includes(20)).toBe(true);
      expect(range.includes(9)).toBe(false);
      expect(range.includes(21)).toBe(false);
    });
  });
});
