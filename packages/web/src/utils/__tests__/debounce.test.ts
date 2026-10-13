import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";
import debounce from "../debounce";

describe("debounce", () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  test("delays invocation until after the timeout", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced("first");

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(99);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("first");
  });

  test("resets the timer and uses the latest arguments", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 50);

    debounced("initial");
    vi.advanceTimersByTime(30);
    debounced("latest");

    vi.advanceTimersByTime(49);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("latest");
  });
});
