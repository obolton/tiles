import { describe, expect, it } from "vitest";
import { clampSize, isPanelEdge, panelAxis, panelSign, resolveSize } from "../geometry";

describe("panelAxis", () => {
  it("resizes left/right panels horizontally", () => {
    expect(panelAxis("left")).toBe("x");
    expect(panelAxis("right")).toBe("x");
  });

  it("resizes top/bottom panels vertically", () => {
    expect(panelAxis("top")).toBe("y");
    expect(panelAxis("bottom")).toBe("y");
  });
});

describe("panelSign", () => {
  it("grows left/top panels with a positive delta", () => {
    expect(panelSign("left")).toBe(1);
    expect(panelSign("top")).toBe(1);
  });

  it("grows right/bottom panels with a negative delta", () => {
    expect(panelSign("right")).toBe(-1);
    expect(panelSign("bottom")).toBe(-1);
  });
});

describe("clampSize", () => {
  it("clamps below the minimum", () => {
    expect(clampSize(50, 100, 400)).toBe(100);
  });

  it("clamps above the maximum", () => {
    expect(clampSize(500, 100, 400)).toBe(400);
  });

  it("leaves in-range values untouched", () => {
    expect(clampSize(200, 100, 400)).toBe(200);
  });

  it("supports an unbounded maximum", () => {
    expect(clampSize(10_000, 0, Infinity)).toBe(10_000);
  });
});

describe("resolveSize", () => {
  it("adds the horizontal delta for a left panel", () => {
    expect(resolveSize("left", 200, 40, 0, 0, Infinity)).toBe(240);
  });

  it("subtracts the horizontal delta for a right panel", () => {
    expect(resolveSize("right", 200, 40, 0, 0, Infinity)).toBe(160);
  });

  it("adds the vertical delta for a top panel", () => {
    expect(resolveSize("top", 200, 0, 40, 0, Infinity)).toBe(240);
  });

  it("subtracts the vertical delta for a bottom panel", () => {
    expect(resolveSize("bottom", 200, 0, 40, 0, Infinity)).toBe(160);
  });

  it("ignores the off-axis delta", () => {
    expect(resolveSize("left", 200, 40, 999, 0, Infinity)).toBe(240);
    expect(resolveSize("top", 200, 999, 40, 0, Infinity)).toBe(240);
  });

  it("clamps the resolved size to the bounds", () => {
    expect(resolveSize("left", 200, 400, 0, 100, 300)).toBe(300);
    expect(resolveSize("right", 200, 400, 0, 100, 300)).toBe(100);
  });
});

describe("isPanelEdge", () => {
  it("accepts the four edges", () => {
    expect(isPanelEdge("top")).toBe(true);
    expect(isPanelEdge("bottom")).toBe(true);
    expect(isPanelEdge("left")).toBe(true);
    expect(isPanelEdge("right")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isPanelEdge("middle")).toBe(false);
    expect(isPanelEdge(null)).toBe(false);
  });
});
