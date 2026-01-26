import { describe, expect, test, vi } from "vitest";
import {
  ReactiveValue,
  reactive,
  ReactiveFlag,
  flag,
  Computed,
  Combined,
  combine,
  isReactive,
} from "../reactivity";

describe("ReactiveValue", () => {
  describe("constructor", () => {
    test("sets the initial value", () => {
      const r = new ReactiveValue(1);
      expect(r.value).toBe(1);
    });
  });

  describe("subscribe", () => {
    test("returns an unsubscribe callback", () => {
      const r = new ReactiveValue(1);
      const unsubscribe = r.subscribe(vi.fn());
      expect(unsubscribe).toBeInstanceOf(Function);
    });
  });

  describe("unsubscribe", () => {
    test("returns true if the subscriber was removed", () => {
      const r = new ReactiveValue(1);
      const subscriber = vi.fn();
      r.subscribe(subscriber);
      expect(r.unsubscribe(subscriber)).toBe(true);
    });

    test("returns false if the subscriber was not removed", () => {
      const r = new ReactiveValue(1);
      const subscriber = vi.fn();
      expect(r.unsubscribe(subscriber)).toBe(false);
    });
  });

  test("notifies subscribers when the value is updated", () => {
    const r = new ReactiveValue(1);
    const subscribers = [vi.fn(), vi.fn()] as const;
    r.subscribe(subscribers[0]);
    r.value = 2;
    expect(subscribers[0]).toHaveBeenCalledTimes(1);
    expect(subscribers[1]).toHaveBeenCalledTimes(0);
    r.subscribe(subscribers[1]);
    r.value = 3;
    expect(subscribers[0]).toHaveBeenCalledTimes(2);
    expect(subscribers[1]).toHaveBeenCalledTimes(1);
  });

  test("does not notify subscribers if the value is set but unchanged", () => {
    const r = new ReactiveValue(1);
    const subscriber = vi.fn();
    r.subscribe(subscriber);
    r.value = 1;
    expect(subscriber).toHaveBeenCalledTimes(0);
  });

  test("does not notify subscribers after they have been removed", () => {
    const r = new ReactiveValue(1);
    const subscriber = vi.fn();
    r.subscribe(subscriber);
    r.value = 2;
    expect(subscriber).toHaveBeenCalledTimes(1);
    r.unsubscribe(subscriber);
    r.value = 3;
    expect(subscriber).toHaveBeenCalledTimes(1);
  });
});

describe("reactive", () => {
  test("returns a ReactiveValue", () => {
    const r = reactive(1);
    expect(r).toBeInstanceOf(ReactiveValue);
    expect(r.value).toBe(1);
  });
});

describe("ReactiveFlag", () => {
  test("sets the initial value", () => {
    const r = new ReactiveFlag(true);
    expect(r.value).toBe(true);
  });

  test("turns on", () => {
    const r = new ReactiveFlag(false);
    r.on();
    expect(r.value).toBe(true);
  });

  test("turns off", () => {
    const r = new ReactiveFlag(true);
    r.off();
    expect(r.value).toBe(false);
  });

  test("toggles on", () => {
    const r = new ReactiveFlag(false);
    r.toggle();
    expect(r.value).toBe(true);
  });

  test("toggles off", () => {
    const r = new ReactiveFlag(true);
    r.toggle();
    expect(r.value).toBe(false);
  });
});

describe("flag", () => {
  test("returns a ReactiveFlag", () => {
    const r = flag(false);
    expect(r).toBeInstanceOf(ReactiveFlag);
    expect(r.value).toBe(false);
  });
});

describe("Computed", () => {
  test("computes a value from a single input", () => {
    const r = new ReactiveValue(1);
    const computed = new Computed(r, (input) => input + 1);
    expect(computed.value).toBe(2);
    r.value = 3;
    expect(computed.value).toBe(4);
  });

  test("subscribes to a computed value", () => {
    const r = new ReactiveValue(1);
    const computed = new Computed(r, (input) => input % 2);
    const subscriber = vi.fn();
    computed.subscribe(subscriber);
    r.value = 3;
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  test("defers the computation until the computed value is read", () => {
    const r = new ReactiveValue(1);
    const transform = vi.fn((value: number) => value + 1);
    const computed = new Computed(r, transform);
    expect(transform).toHaveBeenCalledTimes(0);
    expect(computed.value).toBe(2);
    expect(transform).toHaveBeenCalledTimes(1);
  });

  test("caches the computed value", () => {
    const r = new ReactiveValue(1);
    const transform = vi.fn((value: number) => value + 1);
    const computed = new Computed(r, transform);
    expect(transform).toHaveBeenCalledTimes(0);
    const results = [computed.value, computed.value, computed.value];
    expect(results).toStrictEqual([2, 2, 2]);
    expect(transform).toHaveBeenCalledTimes(1);
  });
});

describe("Combined", () => {
  test("combines multiple reactive values", () => {
    const a = new ReactiveValue(1);
    const b = new ReactiveValue("hello");
    const combined = combine({ a, b });
    expect(combined.value).toStrictEqual({ a: 1, b: "hello" });
  });

  test("updates when any input changes", () => {
    const a = new ReactiveValue(1);
    const b = new ReactiveValue(2);
    const combined = combine({ a, b });
    const subscriber = vi.fn();
    combined.subscribe(subscriber);

    a.value = 10;
    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(combined.value).toStrictEqual({ a: 10, b: 2 });

    b.value = 20;
    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(combined.value).toStrictEqual({ a: 10, b: 20 });
  });

  test("works with derive for multi-input computed", () => {
    const a = new ReactiveValue(1);
    const b = new ReactiveValue(2);
    const sum = combine({ a, b }).derive(({ a, b }) => a + b);
    expect(sum.value).toBe(3);

    a.value = 10;
    expect(sum.value).toBe(12);
  });
});

describe("combine", () => {
  test("returns a Combined instance", () => {
    const a = reactive(1);
    const b = reactive(2);
    const combined = combine({ a, b });
    expect(combined).toBeInstanceOf(Combined);
  });

  test("accepts an optional transform function", () => {
    const a = reactive(1);
    const b = reactive(2);
    const sum = combine({ a, b }, ({ a, b }) => a + b);
    expect(sum.value).toBe(3);

    a.value = 10;
    expect(sum.value).toBe(12);
  });

  test("transform function receives updated values", () => {
    const firstName = reactive("John");
    const lastName = reactive("Doe");
    const fullName = combine(
      { firstName, lastName },
      ({ firstName, lastName }) => `${firstName} ${lastName}`,
    );

    expect(fullName.value).toBe("John Doe");

    firstName.value = "Jane";
    expect(fullName.value).toBe("Jane Doe");

    lastName.value = "Smith";
    expect(fullName.value).toBe("Jane Smith");
  });

  test("notifies subscribers when transform result changes", () => {
    const a = reactive(1);
    const b = reactive(2);
    const sum = combine({ a, b }, ({ a, b }) => a + b);
    const subscriber = vi.fn();
    sum.subscribe(subscriber);

    a.value = 10;
    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(sum.value).toBe(12);
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
