import { afterEach, describe, expect, test, vi } from "vitest";
import { focusInside, getFocusedDescendant } from "../focus";

describe("focusInside", () => {
  test.for(["button", "iframe", "input", "object", "select", "summary", "textarea"])(
    "focuses a %s element",
    (tag) => {
      const container = document.createElement("div");
      const element = document.createElement(tag);
      container.append(element);
      const spy = vi.spyOn(element, "focus");
      focusInside(container);
      expect(spy).toHaveBeenCalledTimes(1);
    },
  );

  test("focuses an anchor element with href attribute", () => {
    const container = document.createElement("div");
    const element = document.createElement("a");
    element.href = "#test";
    container.append(element);
    const spy = vi.spyOn(element, "focus");
    focusInside(container);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test("does not focus an anchor element without href attribute", () => {
    const container = document.createElement("div");
    const element = document.createElement("a");
    container.append(element);
    const spy = vi.spyOn(element, "focus");
    focusInside(container);
    expect(spy).not.toHaveBeenCalled();
  });

  test("focuses an area element with href attribute", () => {
    const container = document.createElement("div");
    const element = document.createElement("area");
    element.href = "https://test.com";
    container.append(element);
    const spy = vi.spyOn(element, "focus");
    focusInside(container);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test("does not focus an area element without href attribute", () => {
    const container = document.createElement("div");
    const element = document.createElement("area");
    container.append(element);
    const spy = vi.spyOn(element, "focus");
    focusInside(container);
    expect(spy).not.toHaveBeenCalled();
  });

  test("focuses a contenteditable element", () => {
    const container = document.createElement("div");
    const element = document.createElement("div");
    element.setAttribute("contenteditable", "true");
    container.append(element);
    const spy = vi.spyOn(element, "focus");
    focusInside(container);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test("focuses an element with a non-negative tabindex", () => {
    const container = document.createElement("div");
    const element = document.createElement("div");
    element.setAttribute("tabindex", "0");
    container.append(element);
    const spy = vi.spyOn(element, "focus");
    focusInside(container);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test("does not focus an element with a negative tabindex", () => {
    const container = document.createElement("div");
    const element = document.createElement("div");
    element.setAttribute("tabindex", "-1");
    container.append(element);
    const spy = vi.spyOn(element, "focus");
    focusInside(container);
    expect(spy).not.toHaveBeenCalled();
  });

  test("does not focus other element types", () => {
    const container = document.createElement("div");
    const element = document.createElement("div");
    container.append(element);
    const spy = vi.spyOn(element, "focus");
    focusInside(container);
    expect(spy).not.toHaveBeenCalled();
  });

  test("focuses the first eligible element", () => {
    const container = document.createElement("div");
    const button1 = document.createElement("button");
    const button2 = document.createElement("button");
    container.append(button1, button2);
    const spy1 = vi.spyOn(button1, "focus");
    const spy2 = vi.spyOn(button2, "focus");
    focusInside(container);
    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy2).not.toHaveBeenCalled();
  });

  test("focuses the container if there is no eligible descendant", () => {
    const container = document.createElement("div");
    const element = document.createElement("div");
    container.append(element);
    const spy1 = vi.spyOn(container, "focus");
    const spy2 = vi.spyOn(element, "focus");
    focusInside(container);
    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy2).not.toHaveBeenCalled();
  });

  test("passes the focus options", () => {
    const options: FocusOptions = { preventScroll: true };
    const container = document.createElement("div");
    const button = document.createElement("button");
    container.append(button);
    const spy = vi.spyOn(button, "focus");
    focusInside(container, options);
    expect(spy).toHaveBeenCalledWith(options);
  });
});

describe("getFocusedDescendant", () => {
  afterEach(() => document.body.replaceChildren());

  test("returns the focused element if it is within the target", () => {
    const container = document.createElement("div");
    const input = document.createElement("input");
    container.append(input);
    document.body.append(container);
    input.focus();
    expect(getFocusedDescendant(container)).toBe(input);
  });

  test("returns null if the focused element is not within the target", () => {
    const container = document.createElement("div");
    const input = document.createElement("input");
    document.body.append(container, input);
    input.focus();
    expect(getFocusedDescendant(container)).toBeNull();
  });

  test("returns null there is no focused element", () => {
    const container = document.createElement("div");
    const input = document.createElement("input");
    container.append(input);
    document.body.append(container);
    expect(getFocusedDescendant(container)).toBeNull();
  });
});
