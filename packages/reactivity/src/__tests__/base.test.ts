import { describe, expect, test, vi } from "vitest";
import { Computed } from "../base";
import { ReactiveValue } from "../value";
import { ReactiveArray } from "../array";

describe("BaseReactive", () => {
  describe("subscribe", () => {
    test("abort after subscribe unsubscribes", () => {
      const r = new ReactiveValue(1);
      const subscriber = vi.fn();
      const controller = new AbortController();
      r.subscribe(subscriber, controller.signal);
      r.value = 2;
      expect(subscriber).toHaveBeenCalledTimes(1);
      controller.abort();
      r.value = 3;
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    test("subscribing with an aborted signal is a no-op", () => {
      const r = new ReactiveValue(1);
      const subscriber = vi.fn();
      const controller = new AbortController();
      controller.abort();
      const addEventListener = vi.spyOn(controller.signal, "addEventListener");
      const unsubscribe = r.subscribe(subscriber, controller.signal);
      r.value = 2;
      expect(subscriber).not.toHaveBeenCalled();
      expect(addEventListener).not.toHaveBeenCalled();
      expect(unsubscribe()).toBe(false);
    });

    test("manual unsubscribe removes the abort listener", () => {
      const r = new ReactiveValue(1);
      const controller = new AbortController();
      const removeEventListener = vi.spyOn(controller.signal, "removeEventListener");
      const unsubscribe = r.subscribe(vi.fn(), controller.signal);
      expect(unsubscribe()).toBe(true);
      expect(removeEventListener).toHaveBeenCalledWith("abort", unsubscribe);
    });

    test("subscribing a computed value with an aborted signal does not subscribe to its input", () => {
      const r = new ReactiveValue(1);
      const inputSubscribe = vi.spyOn(r, "subscribe");
      const computed = new Computed(r, (input) => input + 1);
      const controller = new AbortController();
      controller.abort();
      computed.subscribe(vi.fn(), controller.signal);
      expect(inputSubscribe).not.toHaveBeenCalled();
    });
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

  test("caches the computed value while subscribed", () => {
    const r = new ReactiveValue(1);
    const transform = vi.fn((value: number) => value + 1);
    const computed = new Computed(r, transform);
    computed.subscribe(vi.fn());
    const results = [computed.value, computed.value, computed.value];
    expect(results).toStrictEqual([2, 2, 2]);
    expect(transform).toHaveBeenCalledTimes(1);
  });

  describe("unsubscribed", () => {
    test("recomputes on every read", () => {
      const r = new ReactiveValue(1);
      const transform = vi.fn((value: number) => value + 1);
      const computed = new Computed(r, transform);
      expect(computed.value).toBe(2);
      expect(computed.value).toBe(2);
      expect(transform).toHaveBeenCalledTimes(2);
    });

    test("reflects in-place mutations of the input", () => {
      const items = new ReactiveArray([1, 2]);
      const count = new Computed(items, (list) => list.length);
      expect(count.value).toBe(2);
      items.push(3);
      expect(count.value).toBe(3);
    });

    test("keeps chained computed values fresh", () => {
      const items = new ReactiveArray([1, 2]);
      const count = new Computed(items, (list) => list.length);
      const label = new Computed(count, (value) => `${value} items`);
      expect(label.value).toBe("2 items");
      items.push(3);
      expect(label.value).toBe("3 items");
    });

    test("recomputes when resubscribed after a change", () => {
      const r = new ReactiveValue(1);
      const computed = new Computed(r, (value) => value + 1);
      const unsubscribe = computed.subscribe(vi.fn());
      expect(computed.value).toBe(2);
      unsubscribe();
      r.value = 5;
      computed.subscribe(vi.fn());
      expect(computed.value).toBe(6);
    });
  });
});
