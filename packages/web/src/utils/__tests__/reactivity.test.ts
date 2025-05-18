import { describe, expect, test, vi } from "vitest";
import {
  ReactiveValue,
  value,
  ReactiveFlag,
  flag,
  Computed,
  isReactive,
} from "../reactivity";

describe("ReactiveValue", () => {
  describe("constructor", () => {
    test("sets the initial value", () => {
      const reactive = new ReactiveValue(1);
      expect(reactive.value).toBe(1);
    });
  });

  describe("subscribe", () => {
    test("returns an unsubscribe callback", () => {
      const reactive = new ReactiveValue(1);
      const unsubscribe = reactive.subscribe(vi.fn());
      expect(unsubscribe).toBeInstanceOf(Function);
    });
  });

  describe("unsubscribe", () => {
    test("returns true if the subscriber was removed", () => {
      const reactive = new ReactiveValue(1);
      const subscriber = vi.fn();
      reactive.subscribe(subscriber);
      expect(reactive.unsubscribe(subscriber)).toBe(true);
    });

    test("returns false if the subscriber was not removed", () => {
      const reactive = new ReactiveValue(1);
      const subscriber = vi.fn();
      expect(reactive.unsubscribe(subscriber)).toBe(false);
    });
  });

  test("notifies subscribers when the value is updated", () => {
    const reactive = new ReactiveValue(1);
    const subscribers = [vi.fn(), vi.fn()] as const;
    reactive.subscribe(subscribers[0]);
    reactive.value = 2;
    expect(subscribers[0]).toHaveBeenCalledTimes(1);
    expect(subscribers[1]).toHaveBeenCalledTimes(0);
    reactive.subscribe(subscribers[1]);
    reactive.value = 3;
    expect(subscribers[0]).toHaveBeenCalledTimes(2);
    expect(subscribers[1]).toHaveBeenCalledTimes(1);
  });

  test("does not notify subscribers if the value is set but unchanged", () => {
    const reactive = new ReactiveValue(1);
    const subscriber = vi.fn();
    reactive.subscribe(subscriber);
    reactive.value = 1;
    expect(subscriber).toHaveBeenCalledTimes(0);
  });

  test("does not notify subscribers after they have been removed", () => {
    const reactive = new ReactiveValue(1);
    const subscriber = vi.fn();
    reactive.subscribe(subscriber);
    reactive.value = 2;
    expect(subscriber).toHaveBeenCalledTimes(1);
    reactive.unsubscribe(subscriber);
    reactive.value = 3;
    expect(subscriber).toHaveBeenCalledTimes(1);
  });
});

describe("value", () => {
  test("returns a ReactiveValue", () => {
    const reactive = value(1);
    expect(reactive).toBeInstanceOf(ReactiveValue);
    expect(reactive.value).toBe(1);
  });
});

describe("ReactiveFlag", () => {
  test("sets the initial value", () => {
    const reactive = new ReactiveFlag(true);
    expect(reactive.value).toBe(true);
  });

  test("turns on", () => {
    const reactive = new ReactiveFlag(false);
    reactive.on();
    expect(reactive.value).toBe(true);
  });

  test("turns off", () => {
    const reactive = new ReactiveFlag(true);
    reactive.off();
    expect(reactive.value).toBe(false);
  });

  test("toggles on", () => {
    const reactive = new ReactiveFlag(false);
    reactive.toggle();
    expect(reactive.value).toBe(true);
  });

  test("toggles off", () => {
    const reactive = new ReactiveFlag(true);
    reactive.toggle();
    expect(reactive.value).toBe(false);
  });
});

describe("flag", () => {
  test("returns a ReactiveFlag", () => {
    const reactive = flag(false);
    expect(reactive).toBeInstanceOf(ReactiveFlag);
    expect(reactive.value).toBe(false);
  });
});

describe("Computed", () => {
  test("computes a value from a single input", () => {
    const reactive = new ReactiveValue(1);
    const computed = new Computed([reactive], (input) => input + 1);
    expect(computed.value).toBe(2);
    reactive.value = 3;
    expect(computed.value).toBe(4);
  });

  test("computes a value from multiple inputs", () => {
    const reactiveA = new ReactiveValue(1);
    const reactiveB = new ReactiveValue(2);
    const computed = new Computed([reactiveA, reactiveB], (a, b) => a + b);
    expect(computed.value).toBe(3);
    reactiveA.value = 3;
    expect(computed.value).toBe(5);
  });

  test("subscribes to a computed value", () => {
    const reactive = new ReactiveValue(1);
    const computed = new Computed([reactive], (input) => input % 2);
    const subscriber = vi.fn();
    computed.subscribe(subscriber);
    reactive.value = 3;
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  test("defers the computation until the computed value is read", () => {
    const reactive = new ReactiveValue(1);
    const transform = vi.fn((value) => value + 1);
    const computed = new Computed([reactive], transform);
    expect(transform).toHaveBeenCalledTimes(0);
    expect(computed.value).toBe(2);
    expect(transform).toHaveBeenCalledTimes(1);
  });

  test("caches the computed value", () => {
    const reactive = new ReactiveValue(1);
    const transform = vi.fn((value) => value + 1);
    const computed = new Computed([reactive], transform);
    expect(transform).toHaveBeenCalledTimes(0);
    const results = [computed.value, computed.value, computed.value];
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
