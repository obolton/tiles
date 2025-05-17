import { describe, expect, test, vi } from "vitest";
import { ReactiveValue, Computed, isReactive } from "../reactivity";

describe("Reactive", () => {
  describe("constructor", () => {
    test("sets the value", () => {
      const store = new ReactiveValue(1);
      expect(store.value).toBe(1);
    });
  });

  describe("subscribe", () => {
    test("returns an unsubscribe function", () => {
      const store = new ReactiveValue(1);
      const unsubscribe = store.subscribe(vi.fn());
      expect(unsubscribe).toBeInstanceOf(Function);
    });
  });

  describe("unsubscribe", () => {
    test("returns true if the subscriber was removed", () => {
      const store = new ReactiveValue(1);
      const subscriber = vi.fn();
      store.subscribe(subscriber);
      expect(store.unsubscribe(subscriber)).toBe(true);
    });

    test("returns false if the subscriber was not removed", () => {
      const store = new ReactiveValue(1);
      const subscriber = vi.fn();
      expect(store.unsubscribe(subscriber)).toBe(false);
    });
  });

  test("notifies subscribers if the value is set", () => {
    const store = new ReactiveValue(1);
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
    const store = new ReactiveValue(1);
    const subscriber = vi.fn();
    store.subscribe(subscriber);
    store.value = 1;
    expect(subscriber).toHaveBeenCalledTimes(0);
  });

  test("does not notify subscribers after they have been removed", () => {
    const store = new ReactiveValue(1);
    const subscriber = vi.fn();
    store.subscribe(subscriber);
    store.value = 2;
    expect(subscriber).toHaveBeenCalledTimes(1);
    store.unsubscribe(subscriber);
    store.value = 3;
    expect(subscriber).toHaveBeenCalledTimes(1);
  });
});

describe("Computed", () => {
  test("derives a value from a single input", () => {
    const store = new ReactiveValue(1);
    const derived = new Computed([store], (value) => value + 1);
    expect(derived.value).toBe(2);
    store.value = 3;
    expect(derived.value).toBe(4);
  });

  test("derives a value from multiple inputs", () => {
    const storeA = new ReactiveValue(1);
    const storeB = new ReactiveValue(2);
    const derived = new Computed([storeA, storeB], (a, b) => a + b);
    expect(derived.value).toBe(3);
    storeA.value = 3;
    expect(derived.value).toBe(5);
  });

  test("defers the transformation until the computed value is read", () => {
    const store = new ReactiveValue(1);
    const transform = vi.fn((value) => value + 1);
    const derived = new Computed([store], transform);
    expect(transform).toHaveBeenCalledTimes(0);
    expect(derived.value).toBe(2);
    expect(transform).toHaveBeenCalledTimes(1);
  });

  test("caches the computed value", () => {
    const store = new ReactiveValue(1);
    const transform = vi.fn((value) => value + 1);
    const derived = new Computed([store], transform);
    expect(transform).toHaveBeenCalledTimes(0);
    const results = [derived.value, derived.value, derived.value];
    expect(results).toStrictEqual([2, 2, 2]);
    expect(transform).toHaveBeenCalledTimes(1);
  });
});

describe("isReactive", () => {
  test("returns true if the value passed is reactive", () => {
    expect(isReactive(new ReactiveValue(0))).toBe(true);
  });

  test("returns false if the value passed is not reactive", () => {
    expect(isReactive(2)).toBe(false);
  });
});
