import { plot, axisX, axisY, lineY } from "@observablehq/plot";

export interface Mark {
  label: string | number;
  value: number | null | undefined;
}

export interface Series {
  marks: Iterable<Mark>;
}

declare global {
  interface HTMLElementTagNameMap {
    "chart-view": ChartView;
  }
}

export default class ChartView extends HTMLElement {
  series: Series[] = [];

  private readonly resizeObserver;

  constructor() {
    super();

    this.resizeObserver = new ResizeObserver(
      this.resizeObserverCallback.bind(this),
    );
  }

  connectedCallback() {
    this.resizeObserver.observe(this);
  }

  disconnectedCallback() {
    this.resizeObserver.disconnect();
  }

  private resizeObserverCallback() {
    this.draw();
  }

  draw() {
    if (this.series.length === 0) {
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
        ...this.series.map((series) =>
          lineY(series.marks, { x: "label", y: "value" }),
        ),
      ],
    });
    this.replaceChildren(chart);
  }
}

customElements.define("chart-view", ChartView);
