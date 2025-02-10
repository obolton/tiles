import { describe, expect, test, vi } from "vitest";
import { Store, DerivedStore } from "../stores";

describe("Store", () => {
  describe("constructor", () => {
    test("sets the value", () => {
      const store = new Store(1);
      expect(store.value).toBe(1);
    });
  });

  describe("subscribe", () => {
    test("returns an unsubscribe function", () => {
      const store = new Store(1);
      const unsubscribe = store.subscribe(vi.fn());
      expect(unsubscribe).toBeInstanceOf(Function);
    });
  });

  describe("unsubscribe", () => {
    test("returns true if the subscriber was removed", () => {
      const store = new Store(1);
      const subscriber = vi.fn();
      store.subscribe(subscriber);
      expect(store.unsubscribe(subscriber)).toBe(true);
    });

    test("returns false if the subscriber was not removed", () => {
      const store = new Store(1);
      const subscriber = vi.fn();
      expect(store.unsubscribe(subscriber)).toBe(false);
    });
  });

  test("notifies subscribers if the value is set", () => {
    const store = new Store(1);
    const subscribers = [vi.fn(), vi.fn()] as const;
    store.subscribe(subscribers[0]);
    store.value = 2;
    expect(subscribers[0]).toHaveBeenCalledTimes(1);
    expect(subscribers[1]).toHaveBeenCalledTimes(0);
    store.subscribe(subscribers[1]);
    store.value = 3;
    expect(subscribers[0]).toHaveBeenCalledTimes(2);
    expect(subscribers[1]).toHaveBeenCalledTimes(1);
  });

  test("does not notify subscribers if the value is set but unchanged", () => {
    const store = new Store(1);
    const subscriber = vi.fn();
    store.subscribe(subscriber);
    store.value = 1;
    expect(subscriber).toHaveBeenCalledTimes(0);
  });

  test("does not notify subscribers after they have been removed", () => {
    const store = new Store(1);
    const subscriber = vi.fn();
    store.subscribe(subscriber);
    store.value = 2;
    expect(subscriber).toHaveBeenCalledTimes(1);
    store.unsubscribe(subscriber);
    store.value = 3;
    expect(subscriber).toHaveBeenCalledTimes(1);
  });
});

describe("DerivedStore", () => {
  test("derives a value from an input store", () => {
    const store = new Store(1);
    const derived = new DerivedStore(store, (value) => value + 1);
    expect(derived.value).toBe(2);
    store.value = 3;
    expect(derived.value).toBe(4);
  });

  test("defers the transformation until the derived value is read", () => {
    const store = new Store(1);
    const transform = vi.fn((value) => value + 1);
    const derived = new DerivedStore(store, transform);
    expect(transform).toHaveBeenCalledTimes(0);
    expect(derived.value).toBe(2);
    expect(transform).toHaveBeenCalledTimes(1);
  });

  test("caches the derived value", () => {
    const store = new Store(1);
    const transform = vi.fn((value) => value + 1);
    const derived = new DerivedStore(store, transform);
    expect(transform).toHaveBeenCalledTimes(0);
    const results = [derived.value, derived.value, derived.value];
    expect(results).toStrictEqual([2, 2, 2]);
    expect(transform).toHaveBeenCalledTimes(1);
  });
});
