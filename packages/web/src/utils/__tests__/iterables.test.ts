import { describe, expect, test } from "vitest";
import { last } from "../iterables";

describe("last", () => {
  test("returns the last item of an array", () => {
    expect(last([1, 2, 3])).toBe(3);
  });

  test("returns the last item of a set in insertion order", () => {
    expect(last(new Set(["a", "b", "c"]))).toBe("c");
  });

  test("returns null for an empty iterable", () => {
    expect(last([])).toBeNull();
  });
});
