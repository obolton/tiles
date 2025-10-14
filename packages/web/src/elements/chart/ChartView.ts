import { plot, axisX, axisY, barY, lineY, areaY } from "@observablehq/plot";

declare global {
  interface HTMLElementTagNameMap {
    "chart-view": ChartView;
  }
}

export default class ChartView extends HTMLElement {
  private readonly mutationObserver: MutationObserver;
  private readonly resizeObserver: ResizeObserver;

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
    this.draw();
    this.mutationObserver.observe(this, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["type"],
    });
    this.resizeObserver.observe(this);
  }

  disconnectedCallback() {
    this.mutationObserver.disconnect();
    this.resizeObserver.disconnect();
  }

  private mutationObserverCallback() {
    this.draw();
  }

  private resizeObserverCallback() {
    this.draw();
  }

  draw() {
    const series = Array.from(this.getElementsByTagName("chart-series"));

    if (series.length === 0) {
      this.replaceChildren();
      return;
    }

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
        ...series.map((series) => {
          const marks = series.values.map((value, i) => ({ label: i, value }));
          switch (series.type) {
            default:
            case "BAR":
              return barY(marks, { x: "label", y: "value" });
            case "LINE":
              return lineY(marks, { x: "label", y: "value" });
            case "AREA":
              return areaY(marks, { x: "label", y: "value" });
          }
        }),
      ],
    });
    chart.part = "chart";
    this.shadowRoot?.replaceChildren(chart);
  }
}

customElements.define("chart-view", ChartView);
