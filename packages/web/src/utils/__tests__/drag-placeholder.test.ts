import { describe, expect, test } from "vitest";
import { createDragPlaceholder } from "../drag-placeholder";

describe("createDragPlaceholder", () => {
  test("creates a div with drag-placeholder class", () => {
    const placeholder = createDragPlaceholder();
    expect(placeholder.tagName).toBe("DIV");
    expect(placeholder.classList.contains("drag-placeholder")).toBe(true);
  });

  test("does not set position properties when freeform is false", () => {
    const placeholder = createDragPlaceholder({ x: 10, y: 20 });
    expect(placeholder.style.getPropertyValue("--placeholder-x")).toBe("");
    expect(placeholder.style.getPropertyValue("--placeholder-y")).toBe("");
  });

  test("sets position properties when freeform is true, defaulting to 0,0", () => {
    const defaultPos = createDragPlaceholder({ freeform: true });
    expect(defaultPos.style.getPropertyValue("--placeholder-x")).toBe("0");
    expect(defaultPos.style.getPropertyValue("--placeholder-y")).toBe("0");

    const customPos = createDragPlaceholder({ x: 10, y: 20, freeform: true });
    expect(customPos.style.getPropertyValue("--placeholder-x")).toBe("10");
    expect(customPos.style.getPropertyValue("--placeholder-y")).toBe("20");
  });

  test("sets dimension properties only when provided", () => {
    const empty = createDragPlaceholder();
    expect(empty.style.getPropertyValue("--placeholder-width")).toBe("");
    expect(empty.style.getPropertyValue("--placeholder-height")).toBe("");
    expect(empty.style.getPropertyValue("--placeholder-rows")).toBe("");

    const withDimensions = createDragPlaceholder({
      width: 200,
      height: 150,
      rowSpan: 2,
    });
    expect(withDimensions.style.getPropertyValue("--placeholder-width")).toBe("200");
    expect(withDimensions.style.getPropertyValue("--placeholder-height")).toBe("150");
    expect(withDimensions.style.getPropertyValue("--placeholder-rows")).toBe("2");
  });
});
