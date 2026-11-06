import { describe, expect, expectTypeOf, test, vi } from "vitest";
import { defineEnv } from "../defineEnv";

describe("defineEnv", () => {
  test("exposes the values", () => {
    const env = defineEnv({ NAME: "tiles", PORT: 3000, DEBUG: true });

    expect(env.NAME).toBe("tiles");
    expect(env.PORT).toBe(3000);
    expect(env.DEBUG).toBe(true);
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

  test("throws when a missing value is read", () => {
    const env = defineEnv({ NAME: undefined });

    expect(() => env.NAME).toThrow("Missing environment variable: NAME");
  });

  test.each([
    ["undefined", undefined],
    ["an empty string", ""],
    ["NaN", Number("not-a-number")],
  ])("treats %s as missing", (_, value) => {
    const env = defineEnv({ VALUE: value });

    expect(() => env.VALUE).toThrow("Missing environment variable: VALUE");
  });

  test("treats false and zero as present", () => {
    const env = defineEnv({ FLAG: false, COUNT: 0 });

    expect(env.FLAG).toBe(false);
    expect(env.COUNT).toBe(0);
  });

  test("lists only the variables as enumerable keys", () => {
    const env = defineEnv({ A: "a", B: "b" });

    expect(Object.keys(env)).toEqual(["A", "B"]);
  });

  test("is frozen", () => {
    const env = defineEnv({ A: "a" });

    expect(Object.isFrozen(env)).toBe(true);
  });

  describe("validate", () => {
    test("passes when every value is set", () => {
      const env = defineEnv({ A: "a", B: 1 });

      expect(() => env.validate()).not.toThrow();
    });

    test("throws listing every missing variable", () => {
      const env = defineEnv({ A: undefined, B: "b", C: "" });

      expect(() => env.validate()).toThrow("Missing environment variables: A, C");
    });

    test("warns instead of throwing when not strict", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const env = defineEnv({ A: undefined, B: "b" });

      expect(() => env.validate({ strict: false })).not.toThrow();
      expect(warn).toHaveBeenCalledExactlyOnceWith("Missing environment variables: A");
    });

    test("does not warn when every value is set", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const env = defineEnv({ A: "a" });

      env.validate({ strict: false });

      expect(warn).not.toHaveBeenCalled();
    });
  });
});
