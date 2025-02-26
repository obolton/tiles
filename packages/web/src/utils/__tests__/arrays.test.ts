import { describe, expect, test } from "vitest";
import { moveElement } from "../arrays";

describe("moveElement", () => {
  test("moves an element up the array", () => {
    const array = [1, 2, 3, 4, 5];
    const result = moveElement(array, 1, 3);
    expect(result).toEqual([1, 3, 4, 2, 5]);
  });

  test("moves an element down the array", () => {
    const array = [1, 2, 3, 4, 5];
    const result = moveElement(array, 3, 1);
    expect(result).toEqual([1, 4, 2, 3, 5]);
  });

  test("keeps an element at the same index", () => {
    const array = [1, 2, 3, 4, 5];
    const result = moveElement(array, 1, 1);
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });

  test("does not mutate the input array", () => {
    const array = [1, 2, 3, 4, 5];
    moveElement(array, 1, 3);
    expect(array).toEqual([1, 2, 3, 4, 5]);
  });
});
