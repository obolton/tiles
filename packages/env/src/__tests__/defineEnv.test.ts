import { describe, expect, expectTypeOf, test, vi } from "vitest";
import { defineEnv } from "../defineEnv";

// A function, so the declared type is not narrowed to `undefined` by assignment.
function unset(): string | undefined {
  return undefined;
}

describe("defineEnv", () => {
  test("exposes the required values", () => {
    const env = defineEnv({ required: { NAME: "tiles", PORT: 3000 } });

    expect(env.NAME).toBe("tiles");
    expect(env.PORT).toBe(3000);
  });

  test("types the required values as present", () => {
    const env = defineEnv({ required: { NAME: unset(), PORT: Number("3000") } });

    expectTypeOf<typeof env.NAME>().toEqualTypeOf<string>();
    expectTypeOf<typeof env.PORT>().toEqualTypeOf<number>();
  });

  test("throws when a missing value is read", () => {
    const env = defineEnv({ required: { NAME: unset() } });

    expect(() => env.NAME).toThrow("Missing environment variable: NAME");
  });

  test.each([
    ["undefined", undefined],
    ["an empty string", ""],
    ["NaN", Number("not-a-number")],
  ])("treats %s as missing", (_, value) => {
    const env = defineEnv({ required: { VALUE: value } });

    expect(() => env.VALUE).toThrow("Missing environment variable: VALUE");
  });

  test("lists only the variables as enumerable keys", () => {
    const env = defineEnv({ required: { A: "a", B: "b" } });

    expect(Object.keys(env)).toEqual(["A", "B"]);
  });

  test("is frozen", () => {
    const env = defineEnv({ required: { A: "a" } });

    expect(Object.isFrozen(env)).toBe(true);
  });

  describe("validate", () => {
    test("passes when every value is set", () => {
      const env = defineEnv({ required: { A: "a", B: 1 } });

      expect(() => env.validate()).not.toThrow();
    });

    test("throws listing every missing variable", () => {
      const env = defineEnv({ required: { A: unset(), B: "b", C: "" } });

      expect(() => env.validate()).toThrow("Missing environment variables: A, C");
    });

    test("warns instead of throwing when not strict", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const env = defineEnv({ required: { A: unset(), B: "b" } });

      expect(() => env.validate({ strict: false })).not.toThrow();
      expect(warn).toHaveBeenCalledExactlyOnceWith("Missing environment variables: A");
    });

    test("does not warn when every value is set", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const env = defineEnv({ required: { A: "a" } });

      env.validate({ strict: false });

      expect(warn).not.toHaveBeenCalled();
    });
  });
});
