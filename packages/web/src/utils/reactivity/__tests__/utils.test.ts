import { describe, expect, test } from "vitest";
import { isReactive } from "../utils";
import { ReactiveValue } from "../value";

describe("isReactive", () => {
  test("returns true if the value passed is reactive", () => {
    expect(isReactive(new ReactiveValue(0))).toBe(true);
  });

  test("returns false if the value passed is not reactive", () => {
    expect(isReactive(2)).toBe(false);
  });
});
