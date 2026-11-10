import { describe, expect, test, vi, beforeEach } from "vitest";
import {
  mapAttributeName,
  transformCSSProperty,
  isValidStyleValue,
  applyClassList,
  serializeClassList,
  serializeStyles,
  applyStyleObject,
} from "../attributes";
import { reactive } from "carillon";

describe("mapAttributeName", () => {
  test("maps className to class", () => {
    expect(mapAttributeName("className")).toBe("class");
  });

  test("maps htmlFor to for", () => {
    expect(mapAttributeName("htmlFor")).toBe("for");
  });

  test("preserves attribute name casing", () => {
    expect(mapAttributeName("viewBox")).toBe("viewBox");
    expect(mapAttributeName("preserveAspectRatio")).toBe("preserveAspectRatio");
    expect(mapAttributeName("tabIndex")).toBe("tabIndex");
    expect(mapAttributeName("autoFocus")).toBe("autoFocus");
  });

  test("handles data attributes", () => {
    expect(mapAttributeName("data-testid")).toBe("data-testid");
  });
});

describe("transformCSSProperty", () => {
  test("converts camelCase to kebab-case", () => {
    expect(transformCSSProperty("backgroundColor")).toBe("background-color");
  });

  test("converts multiple camelCase segments", () => {
    expect(transformCSSProperty("marginTop")).toBe("margin-top");
  });

  test("preserves already kebab-case names", () => {
    expect(transformCSSProperty("margin-top")).toBe("margin-top");
  });

  test("handles single word properties", () => {
    expect(transformCSSProperty("color")).toBe("color");
  });
});

describe("isValidStyleValue", () => {
  test("returns true for non-empty string", () => {
    expect(isValidStyleValue("red")).toBe(true);
  });

  test("returns true for string with units", () => {
    expect(isValidStyleValue("10px")).toBe(true);
  });

  test("returns false for empty string", () => {
    expect(isValidStyleValue("")).toBe(false);
  });

  test("returns false for whitespace-only string", () => {
    expect(isValidStyleValue("   ")).toBe(false);
  });

  test("returns false for string with only newlines and tabs", () => {
    expect(isValidStyleValue("\t\n")).toBe(false);
  });

  test("returns true for zero", () => {
    expect(isValidStyleValue(0)).toBe(true);
  });

  test("returns true for positive integer", () => {
    expect(isValidStyleValue(42)).toBe(true);
  });

  test("returns true for negative integer", () => {
    expect(isValidStyleValue(-10)).toBe(true);
  });

  test("returns true for decimal", () => {
    expect(isValidStyleValue(0.5)).toBe(true);
  });

  test("returns false for NaN", () => {
    expect(isValidStyleValue(NaN)).toBe(false);
  });

  test("returns false for Infinity", () => {
    expect(isValidStyleValue(Infinity)).toBe(false);
  });

  test("returns false for negative Infinity", () => {
    expect(isValidStyleValue(-Infinity)).toBe(false);
  });

  test("returns false for null", () => {
    expect(isValidStyleValue(null)).toBe(false);
  });

  test("returns false for undefined", () => {
    expect(isValidStyleValue(undefined)).toBe(false);
  });
});

describe("applyClassList", () => {
  let element: HTMLDivElement;

  beforeEach(() => {
    element = document.createElement("div");
  });

  test("adds classes with true values", () => {
    applyClassList(element, { foo: true, bar: true });
    expect(element.classList.contains("foo")).toBe(true);
    expect(element.classList.contains("bar")).toBe(true);
  });

  test("does not add classes with false values", () => {
    applyClassList(element, { foo: true, bar: false });
    expect(element.classList.contains("foo")).toBe(true);
    expect(element.classList.contains("bar")).toBe(false);
  });

  test("does not add classes with null values", () => {
    applyClassList(element, { foo: true, bar: null });
    expect(element.classList.contains("foo")).toBe(true);
    expect(element.classList.contains("bar")).toBe(false);
  });

  test("does not add classes with undefined values", () => {
    applyClassList(element, { foo: true, bar: undefined });
    expect(element.classList.contains("foo")).toBe(true);
    expect(element.classList.contains("bar")).toBe(false);
  });

  test("removes classes not in the new value", () => {
    element.classList.add("existing");
    applyClassList(element, { foo: true });
    expect(element.classList.contains("existing")).toBe(false);
    expect(element.classList.contains("foo")).toBe(true);
  });

  test("handles reactive values", () => {
    const enabled = reactive(true);
    applyClassList(element, { foo: enabled });
    expect(element.classList.contains("foo")).toBe(true);

    enabled.value = false;
    expect(element.classList.contains("foo")).toBe(false);
  });

  test("cleans up reactive subscriptions on signal abort", () => {
    const controller = new AbortController();
    const enabled = reactive(true);
    const subscribeSpy = vi.spyOn(enabled, "subscribe");

    applyClassList(element, { foo: enabled }, controller.signal);
    expect(subscribeSpy).toHaveBeenCalledWith(expect.any(Function), controller.signal);
  });
});

describe("serializeClassList", () => {
  test("serializes classes with true values", () => {
    expect(serializeClassList({ foo: true, bar: true })).toBe("foo bar");
  });

  test("excludes classes with false values", () => {
    expect(serializeClassList({ foo: true, bar: false })).toBe("foo");
  });

  test("excludes classes with null values", () => {
    expect(serializeClassList({ foo: true, bar: null })).toBe("foo");
  });

  test("excludes classes with undefined values", () => {
    expect(serializeClassList({ foo: true, bar: undefined })).toBe("foo");
  });

  test("returns empty string for no enabled classes", () => {
    expect(serializeClassList({ foo: false, bar: false })).toBe("");
  });

  test("handles reactive values by reading current value", () => {
    const enabled = reactive(true);
    expect(serializeClassList({ foo: enabled, bar: true })).toBe("foo bar");

    enabled.value = false;
    expect(serializeClassList({ foo: enabled, bar: true })).toBe("bar");
  });
});

describe("applyStyleObject", () => {
  let element: HTMLDivElement;

  beforeEach(() => {
    element = document.createElement("div");
  });

  test("sets style properties with string values", () => {
    applyStyleObject(element, { color: "red" });
    expect(element.style.color).toBe("red");
  });

  test("sets style properties with number values", () => {
    applyStyleObject(element, { opacity: 0.5 });
    expect(element.style.opacity).toBe("0.5");
  });

  test("transforms camelCase to kebab-case", () => {
    applyStyleObject(element, { backgroundColor: "blue" });
    expect(element.style.backgroundColor).toBe("blue");
  });

  test("removes properties with null values", () => {
    element.style.color = "red";
    applyStyleObject(element, { color: null });
    expect(element.style.color).toBe("");
  });

  test("removes properties with undefined values", () => {
    element.style.color = "red";
    applyStyleObject(element, { color: undefined });
    expect(element.style.color).toBe("");
  });

  test("removes properties with empty string values", () => {
    element.style.color = "red";
    applyStyleObject(element, { color: "" });
    expect(element.style.color).toBe("");
  });

  test("handles reactive values", () => {
    const color = reactive<string | null>("red");
    applyStyleObject(element, { color });
    expect(element.style.color).toBe("red");

    color.value = "blue";
    expect(element.style.color).toBe("blue");

    color.value = null;
    expect(element.style.color).toBe("");
  });

  test("cleans up reactive subscriptions on signal abort", () => {
    const controller = new AbortController();
    const color = reactive("red");
    const subscribeSpy = vi.spyOn(color, "subscribe");

    applyStyleObject(element, { color }, controller.signal);
    expect(subscribeSpy).toHaveBeenCalledWith(expect.any(Function), controller.signal);
  });
});

describe("serializeStyles", () => {
  test("serializes string value", () => {
    expect(serializeStyles({ color: "red" })).toBe("color:red");
  });

  test("serializes number value", () => {
    expect(serializeStyles({ opacity: 0.5 })).toBe("opacity:0.5");
  });

  test("serializes multiple properties", () => {
    expect(
      serializeStyles({
        backgroundColor: "red",
        marginTop: 12,
      }),
    ).toBe("background-color:red;margin-top:12");
  });

  test("ignores null value", () => {
    expect(
      serializeStyles({
        visibility: null,
        opacity: 1,
      }),
    ).toBe("opacity:1");
  });

  test("ignores undefined value", () => {
    expect(
      serializeStyles({
        display: undefined,
        opacity: 1,
      }),
    ).toBe("opacity:1");
  });

  test("ignores empty string", () => {
    expect(
      serializeStyles({
        color: "",
        opacity: 1,
      }),
    ).toBe("opacity:1");
  });

  test("ignores whitespace-only string", () => {
    expect(
      serializeStyles({
        background: "   ",
        opacity: 1,
      }),
    ).toBe("opacity:1");
  });

  test("ignores NaN", () => {
    expect(
      serializeStyles({
        opacity: NaN,
        order: 1,
      }),
    ).toBe("order:1");
  });

  test("ignores Infinity", () => {
    expect(
      serializeStyles({
        zIndex: Infinity,
        order: 1,
      }),
    ).toBe("order:1");
  });

  test("handles reactive values by reading current value", () => {
    const color = reactive("red");
    expect(serializeStyles({ color })).toBe("color:red");

    color.value = "blue";
    expect(serializeStyles({ color })).toBe("color:blue");
  });
});
