import { describe, expect, test, vi } from "vitest";
import { ReactiveSet, set } from "../set";

describe("ReactiveSet", () => {
  describe("size", () => {
    test("returns the set size", () => {
      const s = new ReactiveSet(new Set([1, 2, 3]));
      expect(s.size).toBe(3);
    });

    test("returns 0 for an empty set", () => {
      const s = new ReactiveSet(new Set());
      expect(s.size).toBe(0);
    });
  });

  describe("has", () => {
    test("returns true for existing items", () => {
      const s = new ReactiveSet(new Set(["a", "b"]));
      expect(s.has("a")).toBe(true);
    });

    test("returns false for missing items", () => {
      const s = new ReactiveSet(new Set(["a", "b"]));
      expect(s.has("c")).toBe(false);
    });
  });

  describe("add", () => {
    test("adds an item", () => {
      const s = new ReactiveSet(new Set<number>());
      s.add(1);
      expect(s.has(1)).toBe(true);
      expect(s.size).toBe(1);
    });

    test("notifies subscribers", () => {
      const s = new ReactiveSet(new Set<number>());
      const subscriber = vi.fn();
      s.subscribe(subscriber);

      s.add(1);

      expect(subscriber).toHaveBeenCalledTimes(1);
    });
  });

  describe("delete", () => {
    test("removes an existing item and returns true", () => {
      const s = new ReactiveSet(new Set([1, 2]));

      expect(s.delete(1)).toBe(true);
      expect(s.has(1)).toBe(false);
      expect(s.size).toBe(1);
    });

    test("returns false for a missing item", () => {
      const s = new ReactiveSet(new Set([1]));

      expect(s.delete(2)).toBe(false);
    });

    test("notifies subscribers when an item is removed", () => {
      const s = new ReactiveSet(new Set([1]));
      const subscriber = vi.fn();
      s.subscribe(subscriber);

      s.delete(1);

      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    test("does not notify subscribers when the item is missing", () => {
      const s = new ReactiveSet(new Set([1]));
      const subscriber = vi.fn();
      s.subscribe(subscriber);

      s.delete(2);

      expect(subscriber).not.toHaveBeenCalled();
    });
  });

  describe("toggle", () => {
    test("adds a missing item", () => {
      const s = new ReactiveSet(new Set<number>());
      s.toggle(1);
      expect(s.has(1)).toBe(true);
    });

    test("removes an existing item", () => {
      const s = new ReactiveSet(new Set([1]));
      s.toggle(1);
      expect(s.has(1)).toBe(false);
    });

    test("notifies subscribers", () => {
      const s = new ReactiveSet(new Set<number>());
      const subscriber = vi.fn();
      s.subscribe(subscriber);

      s.toggle(1);

      expect(subscriber).toHaveBeenCalledTimes(1);
    });
  });

  describe("clear", () => {
    test("removes all items", () => {
      const s = new ReactiveSet(new Set([1, 2, 3]));
      s.clear();
      expect(s.size).toBe(0);
    });

    test("notifies subscribers", () => {
      const s = new ReactiveSet(new Set([1, 2]));
      const subscriber = vi.fn();
      s.subscribe(subscriber);

      s.clear();

      expect(subscriber).toHaveBeenCalledTimes(1);
    });
  });

  describe("replace", () => {
    test("replaces all items", () => {
      const s = new ReactiveSet(new Set([1, 2]));
      s.replace([3, 4, 5]);
      expect(s.size).toBe(3);
      expect(s.has(1)).toBe(false);
      expect(s.has(3)).toBe(true);
    });

    test("notifies subscribers", () => {
      const s = new ReactiveSet(new Set([1]));
      const subscriber = vi.fn();
      s.subscribe(subscriber);

      s.replace([2, 3]);

      expect(subscriber).toHaveBeenCalledTimes(1);
    });
  });

  describe("iteration", () => {
    test("supports for...of", () => {
      const s = new ReactiveSet(new Set([1, 2, 3]));
      const result: number[] = [];

      for (const item of s) {
        result.push(item);
      }

      expect(result).toEqual([1, 2, 3]);
    });

    test("entries returns value-value pairs", () => {
      const s = new ReactiveSet(new Set(["a", "b"]));

      expect([...s.entries()]).toEqual([
        ["a", "a"],
        ["b", "b"],
      ]);
    });

    test("keys returns items", () => {
      const s = new ReactiveSet(new Set(["a", "b"]));

      expect([...s.keys()]).toEqual(["a", "b"]);
    });

    test("values returns items", () => {
      const s = new ReactiveSet(new Set(["a", "b"]));

      expect([...s.values()]).toEqual(["a", "b"]);
    });
  });
});

describe("set", () => {
  test("returns a ReactiveSet", () => {
    const s = set([1, 2, 3]);

    expect(s).toBeInstanceOf(ReactiveSet);
    expect(s.size).toBe(3);
  });

  test("creates an empty set with no arguments", () => {
    const s = set();

    expect(s).toBeInstanceOf(ReactiveSet);
    expect(s.size).toBe(0);
  });
});
