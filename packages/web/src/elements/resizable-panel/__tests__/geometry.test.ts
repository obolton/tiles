import { describe, expect, test } from "vitest";
import {
  clampSize,
  isPanelEdge,
  panelAxis,
  panelSign,
  resolvePhysicalEdge,
  resolveSize,
} from "../geometry";

describe("panelAxis", () => {
  test("resizes left/right panels horizontally", () => {
    expect(panelAxis("left")).toBe("x");
    expect(panelAxis("right")).toBe("x");
  });

  test("resizes top/bottom panels vertically", () => {
    expect(panelAxis("top")).toBe("y");
    expect(panelAxis("bottom")).toBe("y");
  });
});

describe("panelSign", () => {
  test("grows left/top panels with a positive delta", () => {
    expect(panelSign("left")).toBe(1);
    expect(panelSign("top")).toBe(1);
  });

  test("grows right/bottom panels with a negative delta", () => {
    expect(panelSign("right")).toBe(-1);
    expect(panelSign("bottom")).toBe(-1);
  });
});

describe("clampSize", () => {
  test("clamps below the minimum", () => {
    expect(clampSize(50, 100, 400)).toBe(100);
  });

  test("clamps above the maximum", () => {
    expect(clampSize(500, 100, 400)).toBe(400);
  });

  test("leaves in-range values untouched", () => {
    expect(clampSize(200, 100, 400)).toBe(200);
  });

  test("supports an unbounded maximum", () => {
    expect(clampSize(10_000, 0, Infinity)).toBe(10_000);
  });
});

describe("resolveSize", () => {
  test("adds the horizontal delta for a left panel", () => {
    expect(resolveSize("left", 200, 40, 0, 0, Infinity)).toBe(240);
  });

  test("subtracts the horizontal delta for a right panel", () => {
    expect(resolveSize("right", 200, 40, 0, 0, Infinity)).toBe(160);
  });

  test("adds the vertical delta for a top panel", () => {
    expect(resolveSize("top", 200, 0, 40, 0, Infinity)).toBe(240);
  });

  test("subtracts the vertical delta for a bottom panel", () => {
    expect(resolveSize("bottom", 200, 0, 40, 0, Infinity)).toBe(160);
  });

  test("ignores the off-axis delta", () => {
    expect(resolveSize("left", 200, 40, 999, 0, Infinity)).toBe(240);
    expect(resolveSize("top", 200, 999, 40, 0, Infinity)).toBe(240);
  });

  test("clamps the resolved size to the bounds", () => {
    expect(resolveSize("left", 200, 400, 0, 100, 300)).toBe(300);
    expect(resolveSize("right", 200, 400, 0, 100, 300)).toBe(100);
  });
});

describe("resolvePhysicalEdge", () => {
  test("maps inline edges to physical edges in LTR", () => {
    expect(resolvePhysicalEdge("inline-start", "ltr")).toBe("left");
    expect(resolvePhysicalEdge("inline-end", "ltr")).toBe("right");
  });

  test("flips inline edges in RTL", () => {
    expect(resolvePhysicalEdge("inline-start", "rtl")).toBe("right");
    expect(resolvePhysicalEdge("inline-end", "rtl")).toBe("left");
  });

  test("leaves physical edges unchanged in either direction", () => {
    expect(resolvePhysicalEdge("left", "rtl")).toBe("left");
    expect(resolvePhysicalEdge("top", "rtl")).toBe("top");
    expect(resolvePhysicalEdge("bottom", "ltr")).toBe("bottom");
  });
});

describe("isPanelEdge", () => {
  test("accepts the physical edges", () => {
    expect(isPanelEdge("top")).toBe(true);
    expect(isPanelEdge("bottom")).toBe(true);
    expect(isPanelEdge("left")).toBe(true);
    expect(isPanelEdge("right")).toBe(true);
  });

  test("accepts the logical inline edges", () => {
    expect(isPanelEdge("inline-start")).toBe(true);
    expect(isPanelEdge("inline-end")).toBe(true);
  });

  test("rejects anything else", () => {
    expect(isPanelEdge("middle")).toBe(false);
    expect(isPanelEdge(null)).toBe(false);
  });
});
