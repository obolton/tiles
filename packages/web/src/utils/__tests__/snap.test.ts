import { describe, expect, test, vi } from "vitest";
import { findSnapPoint, getSnapPoints, type SnapPoint } from "../snap";

describe("getSnapPoints", () => {
  test("collects sorted snap points relative to the provided origin", () => {
    const origin = { x: 5, y: 10 };
    const first = document.createElement("div");
    first.id = "first";
    const second = document.createElement("div");
    second.id = "second";

    vi.spyOn(first, "getBoundingClientRect").mockReturnValue(new DOMRect(20, 30, 40, 50));
    vi.spyOn(second, "getBoundingClientRect").mockReturnValue(new DOMRect(-10, 0, 30, 10));

    const points = getSnapPoints([first, second], origin);

    expect(points.x).toEqual([
      { type: "edge", id: "second", value: -15 },
      { type: "edge", id: "first", value: 15 },
      { type: "edge", id: "second", value: 15 },
      { type: "edge", id: "first", value: 55 },
    ]);
    expect(points.y).toEqual([
      { type: "edge", id: "second", value: -10 },
      { type: "edge", id: "second", value: 0 },
      { type: "edge", id: "first", value: 20 },
      { type: "edge", id: "first", value: 70 },
    ]);
  });
});

describe("findSnapPoint", () => {
  test("returns the closest snap point inside the threshold across multiple edges", () => {
    const points: SnapPoint[] = [
      { type: "edge", id: "a", value: -20 },
      { type: "edge", id: "b", value: 0 },
      { type: "edge", id: "c", value: 10 },
      { type: "edge", id: "d", value: 25 },
    ];

    const match = findSnapPoint(points, [12, 28], 5);

    expect(match).toEqual({
      point: points[2],
      delta: -2,
      distance: 2,
    });
  });

  test("returns null when no snap point falls within the threshold", () => {
    const points: SnapPoint[] = [
      { type: "edge", id: "a", value: -10 },
      { type: "edge", id: "b", value: 0 },
      { type: "edge", id: "c", value: 20 },
    ];

    expect(findSnapPoint(points, [5, 15], 2)).toBeNull();
  });

  test("prefers the first snap point when distances tie", () => {
    const points: SnapPoint[] = [
      { type: "edge", id: "a", value: 5 },
      { type: "edge", id: "b", value: 7 },
    ];

    const match = findSnapPoint(points, [6], 1);

    expect(match).toEqual({
      point: points[0],
      delta: -1,
      distance: 1,
    });
  });

  test("skips snap points matching the ignore ID", () => {
    const points: SnapPoint[] = [
      { type: "edge", id: "a", value: 2 },
      { type: "edge", id: "b", value: 10 },
      { type: "edge", id: "c", value: 12 },
    ];

    const match = findSnapPoint(points, [10, 11], 3, "b");

    expect(match).toEqual({
      point: points[2],
      delta: 1,
      distance: 1,
    });
  });

  test("returns null when all candidates are ignored", () => {
    const points: SnapPoint[] = [
      { type: "edge", id: "a", value: 4 },
      { type: "edge", id: "b", value: 15 },
    ];

    expect(findSnapPoint(points, [4, 8], 1, "a")).toBeNull();
  });
});
