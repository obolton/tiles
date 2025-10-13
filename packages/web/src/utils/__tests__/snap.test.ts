import { afterEach, describe, expect, test, vi } from "vitest";
import { getMatchingSnapGuide, getSnapGuides, type SnapGuide } from "../snap";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getSnapGuides", () => {
  test("collects sorted edge guides relative to the provided origin", () => {
    const origin = { x: 5, y: 10 };
    const first = document.createElement("div");
    const second = document.createElement("div");

    vi.spyOn(first, "getBoundingClientRect").mockReturnValue(
      new DOMRect(20, 30, 40, 50),
    );
    vi.spyOn(second, "getBoundingClientRect").mockReturnValue(
      new DOMRect(-10, 0, 30, 10),
    );

    const guides = getSnapGuides([first, second], origin);

    expect(guides.x).toEqual([
      { type: "edge", value: -15 },
      { type: "edge", value: 15 },
      { type: "edge", value: 15 },
      { type: "edge", value: 55 },
    ]);
    expect(guides.y).toEqual([
      { type: "edge", value: -10 },
      { type: "edge", value: 0 },
      { type: "edge", value: 20 },
      { type: "edge", value: 70 },
    ]);
  });
});

describe("getMatchingSnapGuide", () => {
  test("returns the closest guide inside the threshold window", () => {
    const guides: SnapGuide[] = [
      { type: "edge", value: -20 },
      { type: "edge", value: 0 },
      { type: "edge", value: 10 },
      { type: "edge", value: 25 },
    ];

    const match = getMatchingSnapGuide(guides, 12, 5);

    expect(match).toEqual({ guide: guides[2], distance: 2 });
  });

  test("returns null when no guide falls within the threshold", () => {
    const guides: SnapGuide[] = [
      { type: "edge", value: -10 },
      { type: "edge", value: 0 },
      { type: "edge", value: 20 },
    ];

    expect(getMatchingSnapGuide(guides, 5, 2)).toBeNull();
  });

  test("prefers the first guide when distances tie", () => {
    const guides: SnapGuide[] = [
      { type: "edge", value: 5 },
      { type: "edge", value: 7 },
    ];

    const match = getMatchingSnapGuide(guides, 6, 1);

    expect(match).toEqual({ guide: guides[0], distance: 1 });
  });
});
