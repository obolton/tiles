import { plot, axisX, axisY, barY, lineY, areaY } from "@observablehq/plot";
import { toCSSColor } from "@/utils/color";
import { createSVGGradient } from "@/utils/svg-gradient";
import type ChartSeries from "./ChartSeries";

declare global {
  interface HTMLElementTagNameMap {
    "chart-view": ChartView;
  }
}

// Plot's default left margin for a y-axis, sized for its default font size
const MARGIN_LEFT = 40;
const LINE_WIDTH = 3;

/**
 * How far the y-axis tick labels extend past the left edge of the chart, in the chart's own
 * units as an ancestor may scale it.
 */
function getAxisOverflow(chart: Element, width: number): number {
  const labels = chart.querySelector('[aria-label="y-axis tick label"]');
  const bounds = chart.getBoundingClientRect();
  if (!labels || bounds.width === 0) {
    return 0;
  }
  const overflow = bounds.left - labels.getBoundingClientRect().left;
  return Math.ceil((overflow * width) / bounds.width);
}

function describeSeries(seriesElements: ChartSeries[]) {
  const description = seriesElements
    .map((series) => {
      const type = series.type.toLowerCase();
      return series.label ? `${series.label} (${type})` : type;
    })
    .join(", ");
  return `Chart: ${description}`;
}

export default class ChartView extends HTMLElement {
  private readonly mutationObserver: MutationObserver;
  private readonly resizeObserver: ResizeObserver;
  private drawScheduled = false;

  constructor() {
    super();

    this.attachShadow({ mode: "open" });

    this.mutationObserver = new MutationObserver(this.mutationObserverCallback.bind(this));

    this.resizeObserver = new ResizeObserver(this.resizeObserverCallback.bind(this));
  }

  connectedCallback() {
    this.scheduleDraw();
    this.mutationObserver.observe(this, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["type", "color", "gradient", "label"],
    });
    this.resizeObserver.observe(this);
    this.addEventListener("serieschange", this);
    document.fonts.addEventListener("loadingdone", this);
  }

  disconnectedCallback() {
    this.mutationObserver.disconnect();
    this.resizeObserver.disconnect();
    this.removeEventListener("serieschange", this);
    document.fonts.removeEventListener("loadingdone", this);
  }

  handleEvent(event: Event) {
    // A font that loads after drawing changes the width of the tick labels
    if (event.type === "serieschange" || event.type === "loadingdone") {
      this.scheduleDraw();
    }
  }

  private mutationObserverCallback() {
    this.scheduleDraw();
  }

  private resizeObserverCallback() {
    this.scheduleDraw();
  }

  private scheduleDraw() {
    if (this.drawScheduled) {
      return;
    }
    this.drawScheduled = true;
    queueMicrotask(() => {
      this.drawScheduled = false;
      if (this.isConnected) {
        this.draw();
      }
    });
  }

  draw() {
    const seriesElements = Array.from(this.getElementsByTagName("chart-series"));

    if (seriesElements.length === 0) {
      this.shadowRoot?.replaceChildren();
      return;
    }

    const rect = this.getBoundingClientRect();
    const chart = this.render(seriesElements, rect, MARGIN_LEFT);
    this.shadowRoot?.replaceChildren(chart);

    // Plot does not measure text, so the tick labels of a larger inherited font overflow the
    // margin. Their width is only known once the chart is attached.
    const overflow = getAxisOverflow(chart, rect.width);
    if (overflow > 0) {
      this.shadowRoot?.replaceChildren(this.render(seriesElements, rect, MARGIN_LEFT + overflow));
    }
  }

  private render(seriesElements: ChartSeries[], rect: DOMRect, marginLeft: number) {
    const gradientDefs: SVGLinearGradientElement[] = [];

    const chart = plot({
      className: "chart",
      width: rect.width,
      height: rect.height,
      marginTop: 16,
      marginBottom: 32,
      marginLeft,
      marks: [
        axisX({ label: null, strokeOpacity: 0.5 }),
        axisY({ label: null, strokeOpacity: 0.5 }),
        ...seriesElements.map((series, index) => {
          const marks = series.values.map((value, i) => ({ label: i, value }));

          let fillOrStroke: string | undefined;
          const firstColor = series.color[0];
          if (series.gradient && series.color.length >= 2) {
            const gradientId = `series-gradient-${index}`;
            gradientDefs.push(createSVGGradient(gradientId, series.color, series.gradient));
            fillOrStroke = `url(#${gradientId})`;
          } else if (firstColor) {
            fillOrStroke = toCSSColor(firstColor);
          }

          switch (series.type) {
            default:
            case "BAR":
              return barY(marks, {
                x: "label",
                y: "value",
                fill: fillOrStroke,
                ariaHidden: "true",
              });
            case "LINE":
              return lineY(marks, {
                x: "label",
                y: "value",
                stroke: fillOrStroke,
                strokeWidth: LINE_WIDTH,
                ariaHidden: "true",
              });
            case "AREA":
              return areaY(marks, {
                x: "label",
                y: "value",
                fill: fillOrStroke,
                ariaHidden: "true",
              });
          }
        }),
      ],
    });

    if (gradientDefs.length > 0) {
      const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      defs.append(...gradientDefs);
      chart.insertBefore(defs, chart.firstChild);
    }

    chart.part = "chart";
    chart.setAttribute("role", "img");
    chart.setAttribute("aria-label", describeSeries(seriesElements));
    return chart;
  }
}

customElements.define("chart-view", ChartView);
