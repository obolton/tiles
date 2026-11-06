import { describe, expect, expectTypeOf, test } from "vitest";
import { defineEnv } from "../defineEnv";

describe("defineEnv", () => {
  test("exposes the values", () => {
    const env = defineEnv({ NAME: "tiles", PORT: 3000, DEBUG: true });

    expect(env).toEqual({ NAME: "tiles", PORT: 3000, DEBUG: true });
  });

  test("types the values as present", () => {
    const source: Record<string, string | undefined> = { NAME: "tiles", PORT: "3000" };
    const env = defineEnv({
      NAME: source.NAME,
      PORT: Number(source.PORT),
      DEBUG: source.DEBUG === "true",
    });

    expectTypeOf<typeof env.NAME>().toEqualTypeOf<string>();
    expectTypeOf<typeof env.PORT>().toEqualTypeOf<number>();
    expectTypeOf<typeof env.DEBUG>().toEqualTypeOf<boolean>();
  });

  test("throws listing every missing variable", () => {
    expect(() => defineEnv({ A: undefined, B: "b", C: "" })).toThrow(
      "Missing environment variables: A, C",
    );
  });

  test.each([
    ["undefined", undefined],
    ["an empty string", ""],
    ["NaN", Number("not-a-number")],
  ])("treats %s as missing", (_, value) => {
    expect(() => defineEnv({ VALUE: value })).toThrow("Missing environment variables: VALUE");
  });

  test("treats false and zero as present", () => {
    const env = defineEnv({ FLAG: false, COUNT: 0 });

    expect(env.FLAG).toBe(false);
    expect(env.COUNT).toBe(0);
  });

  test("is frozen", () => {
    const env = defineEnv({ A: "a" });

    expect(Object.isFrozen(env)).toBe(true);
  });
});
