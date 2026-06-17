import { describe, expect, test } from "vitest";
import "../ChartSeries";

describe("ChartSeries", () => {
  test("dispatches a bubbling serieschange event when values are set", () => {
    const series = document.createElement("chart-series");
    const events: Event[] = [];
    series.addEventListener("serieschange", (event) => events.push(event));

    series.values = [1, 2, null];

    expect(series.values).toEqual([1, 2, null]);
    expect(events).toHaveLength(1);
    expect(events[0]?.bubbles).toBe(true);
  });
});
