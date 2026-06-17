import { plot, axisX, axisY, barY, lineY, areaY } from "@observablehq/plot";
import { toCSSColor } from "@/utils/color";
import { createSVGGradient } from "@/utils/svg-gradient";

declare global {
  interface HTMLElementTagNameMap {
    "chart-view": ChartView;
  }
}

export default class ChartView extends HTMLElement {
  private readonly mutationObserver: MutationObserver;
  private readonly resizeObserver: ResizeObserver;
  private drawScheduled = false;

  constructor() {
    super();

    this.attachShadow({ mode: "open" });

    this.mutationObserver = new MutationObserver(
      this.mutationObserverCallback.bind(this),
    );

    this.resizeObserver = new ResizeObserver(
      this.resizeObserverCallback.bind(this),
    );
  }

  connectedCallback() {
    this.scheduleDraw();
    this.mutationObserver.observe(this, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["type", "color", "gradient"],
    });
    this.resizeObserver.observe(this);
    this.addEventListener("serieschange", this);
  }

  disconnectedCallback() {
    this.mutationObserver.disconnect();
    this.resizeObserver.disconnect();
    this.removeEventListener("serieschange", this);
  }

  handleEvent(event: Event) {
    if (event.type === "serieschange") {
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
    const seriesElements = Array.from(
      this.getElementsByTagName("chart-series"),
    );

    if (seriesElements.length === 0) {
      this.shadowRoot?.replaceChildren();
      return;
    }

    const gradientDefs: SVGLinearGradientElement[] = [];

    const rect = this.getBoundingClientRect();
    const chart = plot({
      className: "chart",
      width: rect.width,
      height: rect.height,
      marginTop: 48,
      marginBottom: 48,
      marks: [
        axisX({ labelArrow: "none", strokeOpacity: 0.5 }),
        axisY({ labelArrow: "none", strokeOpacity: 0.5 }),
        ...seriesElements.map((series, index) => {
          const marks = series.values.map((value, i) => ({ label: i, value }));

          let fillOrStroke: string | undefined;
          const firstColor = series.color[0];
          if (series.gradient && series.color.length >= 2) {
            const gradientId = `series-gradient-${index}`;
            gradientDefs.push(
              createSVGGradient(gradientId, series.color, series.gradient),
            );
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
              });
            case "LINE":
              return lineY(marks, {
                x: "label",
                y: "value",
                stroke: fillOrStroke,
              });
            case "AREA":
              return areaY(marks, {
                x: "label",
                y: "value",
                fill: fillOrStroke,
              });
          }
        }),
      ],
    });

    if (gradientDefs.length > 0) {
      const defs = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "defs",
      );
      defs.append(...gradientDefs);
      chart.insertBefore(defs, chart.firstChild);
    }

    chart.part = "chart";
    this.shadowRoot?.replaceChildren(chart);
  }
}

customElements.define("chart-view", ChartView);
