import { describe, expect, test } from "vitest";
import { pick, omit } from "../objects.ts";

describe("pick", () => {
  test("returns a shallow clone of the object with the specified keys", () => {
    const object = { a: 1, b: 2, c: 3 };
    const result = pick(object, ["a", "c"]);

    expect(result).toEqual({ a: 1, c: 3 });
    expect(result).not.toBe(object);
  });
});

describe("omit", () => {
  test("returns a shallow clone of the object without the specified keys", () => {
    const object = { a: 1, b: 2, c: 3 };
    const result = omit(object, ["a", "c"]);

    expect(result).toEqual({ b: 2 });
    expect(result).not.toBe(object);
  });
});
