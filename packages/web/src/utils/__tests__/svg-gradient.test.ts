import { describe, expect, test } from "vitest";
import { createSVGGradient } from "../svg-gradient";

describe("createSVGGradient", () => {
  test("creates a linearGradient element with the specified id", () => {
    const gradient = createSVGGradient("test-id", ["ff0000", "0000ff"], "VERTICAL");

    expect(gradient.tagName).toBe("linearGradient");
    expect(gradient.id).toBe("test-id");
  });

  test("throws an error when given fewer than two colors", () => {
    expect(() => createSVGGradient("id", [], "VERTICAL")).toThrow(
      "Gradient requires at least two colors",
    );
    expect(() => createSVGGradient("id", ["ff0000"], "VERTICAL")).toThrow(
      "Gradient requires at least two colors",
    );
  });

  describe("gradient direction coordinates", () => {
    test("sets VERTICAL coordinates (top to bottom)", () => {
      const gradient = createSVGGradient("id", ["ff0000", "0000ff"], "VERTICAL");

      expect(gradient.getAttribute("x1")).toBe("0%");
      expect(gradient.getAttribute("y1")).toBe("0%");
      expect(gradient.getAttribute("x2")).toBe("0%");
      expect(gradient.getAttribute("y2")).toBe("100%");
    });

    test("sets HORIZONTAL coordinates (left to right)", () => {
      const gradient = createSVGGradient("id", ["ff0000", "0000ff"], "HORIZONTAL");

      expect(gradient.getAttribute("x1")).toBe("0%");
      expect(gradient.getAttribute("y1")).toBe("0%");
      expect(gradient.getAttribute("x2")).toBe("100%");
      expect(gradient.getAttribute("y2")).toBe("0%");
    });

    test("sets BOTTOM_RIGHT coordinates (top-left to bottom-right)", () => {
      const gradient = createSVGGradient("id", ["ff0000", "0000ff"], "BOTTOM_RIGHT");

      expect(gradient.getAttribute("x1")).toBe("0%");
      expect(gradient.getAttribute("y1")).toBe("0%");
      expect(gradient.getAttribute("x2")).toBe("100%");
      expect(gradient.getAttribute("y2")).toBe("100%");
    });

    test("sets BOTTOM_LEFT coordinates (top-right to bottom-left)", () => {
      const gradient = createSVGGradient("id", ["ff0000", "0000ff"], "BOTTOM_LEFT");

      expect(gradient.getAttribute("x1")).toBe("100%");
      expect(gradient.getAttribute("y1")).toBe("0%");
      expect(gradient.getAttribute("x2")).toBe("0%");
      expect(gradient.getAttribute("y2")).toBe("100%");
    });
  });

  describe("color stops", () => {
    test("creates two stops for two colors", () => {
      const gradient = createSVGGradient("id", ["ff0000", "0000ff"], "VERTICAL");
      const stops = gradient.querySelectorAll("stop");

      expect(stops).toHaveLength(2);
    });

    test("sets correct offsets for two colors", () => {
      const gradient = createSVGGradient("id", ["ff0000", "0000ff"], "VERTICAL");
      const stops = gradient.querySelectorAll("stop");

      expect(stops[0]?.getAttribute("offset")).toBe("0.000%");
      expect(stops[1]?.getAttribute("offset")).toBe("100.000%");
    });

    test("sets correct stop-color attributes", () => {
      const gradient = createSVGGradient("id", ["ff0000", "00ff00"], "VERTICAL");
      const stops = gradient.querySelectorAll("stop");

      expect(stops[0]?.getAttribute("stop-color")).toBe("color(display-p3 1.0000 0.0000 0.0000)");
      expect(stops[1]?.getAttribute("stop-color")).toBe("color(display-p3 0.0000 1.0000 0.0000)");
    });

    test("creates multiple stops for more than two colors", () => {
      const gradient = createSVGGradient("id", ["ff0000", "00ff00", "0000ff"], "VERTICAL");
      const stops = gradient.querySelectorAll("stop");

      expect(stops).toHaveLength(3);
    });

    test("distributes offsets evenly for three colors", () => {
      const gradient = createSVGGradient("id", ["ff0000", "00ff00", "0000ff"], "VERTICAL");
      const stops = gradient.querySelectorAll("stop");

      expect(stops[0]?.getAttribute("offset")).toBe("0.000%");
      expect(stops[1]?.getAttribute("offset")).toBe("50.000%");
      expect(stops[2]?.getAttribute("offset")).toBe("100.000%");
    });

    test("distributes offsets evenly for four colors", () => {
      const gradient = createSVGGradient(
        "id",
        ["ff0000", "00ff00", "0000ff", "ffff00"],
        "HORIZONTAL",
      );
      const stops = gradient.querySelectorAll("stop");

      expect(stops).toHaveLength(4);
      expect(stops[0]?.getAttribute("offset")).toBe("0.000%");
      expect(stops[1]?.getAttribute("offset")).toBe("33.333%");
      expect(stops[2]?.getAttribute("offset")).toBe("66.667%");
      expect(stops[3]?.getAttribute("offset")).toBe("100.000%");
    });
  });
});
