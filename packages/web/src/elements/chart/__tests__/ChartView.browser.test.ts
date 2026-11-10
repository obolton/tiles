import { afterEach, describe, expect, test } from "vitest";
import "../ChartSeries";
import "../ChartView";
import type { ChartSeriesType } from "../ChartSeries";

const style = new CSSStyleSheet();
style.replaceSync(`
  chart-view {
    display: block;
    width: 400px;
    height: 300px;
  }

  chart-view::part(chart) {
    font-size: var(--chart-font-size);
  }
`);

async function render(series: { type: ChartSeriesType; values: number[] }[], fontSize = "18px") {
  document.adoptedStyleSheets = [style];

  const view = document.createElement("chart-view");
  view.style.setProperty("--chart-font-size", fontSize);
  for (const { type, values } of series) {
    const element = document.createElement("chart-series");
    element.setAttribute("type", type);
    element.values = values;
    view.append(element);
  }
  document.body.append(view);

  // Drawing is deferred to a microtask
  await Promise.resolve();

  const chart = view.shadowRoot?.querySelector("svg");
  if (!chart) {
    throw new Error("Missing chart");
  }
  return chart;
}

function tickLabels(chart: SVGSVGElement, axis: "x" | "y") {
  const labels = chart.querySelector(`[aria-label="${axis}-axis tick label"]`);
  if (!labels) {
    throw new Error(`Missing ${axis}-axis tick labels`);
  }
  return labels;
}

afterEach(() => {
  document.body.replaceChildren();
  document.adoptedStyleSheets = [];
});

describe("ChartView", () => {
  test.each(["10px", "18px", "32px"])(
    "keeps the y-axis tick labels inside the chart at a font size of %s",
    async (fontSize) => {
      const chart = await render([{ type: "BAR", values: [120000, 240000, 360000] }], fontSize);

      const labels = tickLabels(chart, "y").getBoundingClientRect();
      expect(labels.width).toBeGreaterThan(0);
      expect(labels.left).toBeGreaterThanOrEqual(chart.getBoundingClientRect().left);
    },
  );

  test("shows tick labels without axis titles", async () => {
    const chart = await render([{ type: "BAR", values: [1, 2, 3] }]);

    expect(tickLabels(chart, "x").textContent).toBe("012");
    expect(chart.querySelector('[aria-label$="axis label"]')).toBeNull();
  });

  test("draws lines thick enough to stand out over bars", async () => {
    const chart = await render([
      { type: "BAR", values: [1, 2, 3] },
      { type: "LINE", values: [1, 2, 3] },
    ]);

    expect(chart.querySelector('[aria-label="line"]')?.getAttribute("stroke-width")).toBe("3");
  });
});
