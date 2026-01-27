import { describe, expect, test, vi } from "vitest";
import { Computed } from "../base";
import { ReactiveValue } from "../value";

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
