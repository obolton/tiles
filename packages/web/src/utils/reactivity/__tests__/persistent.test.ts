import { beforeEach, describe, expect, test, vi } from "vitest";
import { persistent } from "../persistent";

beforeEach(() => {
  localStorage.clear();
});

describe("persistent", () => {
  describe("initialization", () => {
    test("uses the default value when no stored value exists", () => {
      const value = persistent("key", "default");
      expect(value.value).toBe("default");
    });

    test("uses the stored value when one exists", () => {
      localStorage.setItem("key", JSON.stringify("stored"));
      const value = persistent("key", "default");
      expect(value.value).toBe("stored");
    });

    test("uses the default value when stored value is invalid JSON", () => {
      localStorage.setItem("key", "not valid json");
      const value = persistent("key", "default");
      expect(value.value).toBe("default");
    });

    test("supports object values", () => {
      localStorage.setItem("key", JSON.stringify({ a: 1 }));
      const value = persistent("key", { a: 0 });
      expect(value.value).toEqual({ a: 1 });
    });
  });

  describe("reactivity", () => {
    test("persists value changes to localStorage", () => {
      const value = persistent<string>("key", "initial");
      value.value = "updated";
      expect(localStorage.getItem("key")).toBe(JSON.stringify("updated"));
    });

    test("notifies subscribers when value changes", () => {
      const value = persistent<string>("key", "initial");
      const subscriber = vi.fn();
      value.subscribe(subscriber);
      value.value = "updated";
      expect(subscriber).toHaveBeenCalledTimes(1);
    });
  });

  describe("error handling", () => {
    test("falls back to default when localStorage.getItem throws", () => {
      vi.spyOn(localStorage, "getItem").mockImplementation(() => {
        throw new Error("storage error");
      });
      const value = persistent("key", "default");
      expect(value.value).toBe("default");
    });

    test("does not throw when localStorage.setItem fails", () => {
      vi.spyOn(localStorage, "setItem").mockImplementation(() => {
        throw new Error("quota exceeded");
      });
      const value = persistent<string>("key", "initial");
      expect(() => {
        value.value = "updated";
      }).not.toThrow();
    });

    test("does not throw when localStorage.setItem fails on update", () => {
      const value = persistent<string>("key", "initial");
      vi.spyOn(localStorage, "setItem").mockImplementation(() => {
        throw new Error("quota exceeded");
      });
      expect(() => {
        value.value = "updated";
      }).not.toThrow();
    });
  });
});
