import { plot, axisX, axisY, barY, lineY, areaY } from "@observablehq/plot";
import { isDarkCSSColor, toCSSColor } from "@/utils/color";
import { createSVGGradient } from "@/utils/svg-gradient";
import { SERIES_COLORS } from "@/utils/charts";
import css from "./ChartView.css?inline";
import type ChartSeries from "./ChartSeries";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

declare global {
  interface HTMLElementTagNameMap {
    "chart-view": ChartView;
  }
}

interface SeriesColor {
  /** The fill or stroke of the marks: a colour, or a reference to a gradient. */
  paint: string;
  /** The colour standing for the series in the legend. */
  swatch: string;
  gradient?: SVGLinearGradientElement;
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

/** The number of rows up to the last one holding a value or a label. */
function getDataLength(seriesElements: ChartSeries[], labels: readonly (string | null)[]) {
  let length = 0;
  for (const series of seriesElements) {
    for (let i = series.values.length - 1; i >= length; i--) {
      if (series.values[i] != null) {
        length = i + 1;
        break;
      }
    }
  }
  for (let i = labels.length - 1; i >= length; i--) {
    if (labels[i]) {
      length = i + 1;
      break;
    }
  }
  return length;
}

function getSeriesColor(series: ChartSeries, index: number, palette: readonly string[]) {
  const [first] = series.color;
  if (series.gradient && series.color.length >= 2) {
    const gradient = createSVGGradient(`series-gradient-${index}`, series.color, series.gradient);
    return { paint: `url(#${gradient.id})`, swatch: toCSSColor(series.color[0]!), gradient };
  }
  // Series without a fill take the next default colour, in a fixed order.
  const paint = first ? toCSSColor(first) : palette[index % palette.length]!;
  return { paint, swatch: paint };
}

function createLegend(seriesElements: ChartSeries[], colors: SeriesColor[]) {
  const legend = document.createElement("ul");
  legend.className = "legend";
  legend.part.add("legend");
  legend.setAttribute("aria-label", "Legend");
  seriesElements.forEach((series, index) => {
    const item = document.createElement("li");
    const swatch = document.createElement("span");
    swatch.className = "swatch";
    swatch.style.background = colors[index]!.swatch;
    item.append(swatch, series.label || `Series ${index + 1}`);
    legend.append(item);
  });
  return legend;
}

export default class ChartView extends HTMLElement {
  private readonly mutationObserver: MutationObserver;
  private readonly resizeObserver: ResizeObserver;
  private drawScheduled = false;
  #labels: readonly (string | null)[] = [];

  constructor() {
    super();

    this.attachShadow({ mode: "open" });
    this.shadowRoot?.adoptedStyleSheets.push(stylesheet);

    this.mutationObserver = new MutationObserver(this.mutationObserverCallback.bind(this));

    this.resizeObserver = new ResizeObserver(this.resizeObserverCallback.bind(this));
  }

  /** The x-axis label of each row. Rows without one are numbered. */
  get labels(): readonly (string | null)[] {
    return this.#labels;
  }

  set labels(labels: readonly (string | null)[]) {
    this.#labels = labels;
    this.scheduleDraw();
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

  /** The default series colours: steps selected for a dark or a light background. */
  private get palette(): readonly string[] {
    const background = getComputedStyle(this).getPropertyValue("--background-color");
    return isDarkCSSColor(background) ? SERIES_COLORS.dark : SERIES_COLORS.light;
  }

  draw() {
    const root = this.shadowRoot;
    if (!root) {
      return;
    }

    const seriesElements = Array.from(this.getElementsByTagName("chart-series"));
    if (seriesElements.length === 0) {
      root.replaceChildren();
      return;
    }

    const { palette, labels } = this;
    const colors = seriesElements.map((series, index) => getSeriesColor(series, index, palette));
    const legend = seriesElements.length > 1 ? createLegend(seriesElements, colors) : null;
    // The legend is laid out first so the chart can take the remaining height.
    root.replaceChildren(...(legend ? [legend] : []));

    const rect = this.getBoundingClientRect();
    const legendHeight = legend ? legend.getBoundingClientRect().height + 8 : 0;
    const rows = Array.from({ length: getDataLength(seriesElements, labels) }, (_, index) => index);

    const chart = plot({
      className: "chart",
      width: rect.width,
      height: Math.max(rect.height - legendHeight, 0),
      marginTop: 24,
      marginBottom: 48,
      x: { type: "band" },
      marks: [
        axisX({
          label: null,
          tickFormat: (index: number) => labels[index] || String(index + 1),
          strokeOpacity: 0.5,
        }),
        axisY({ label: null, strokeOpacity: 0.5 }),
        ...seriesElements.map((series, index) => {
          const marks = rows.map((row) => ({ row, value: series.values[row] ?? null }));
          const { paint } = colors[index]!;

          switch (series.type) {
            default:
            case "BAR":
              return barY(marks, { x: "row", y: "value", fill: paint, ariaHidden: "true" });
            case "LINE":
              return lineY(marks, { x: "row", y: "value", stroke: paint, ariaHidden: "true" });
            case "AREA":
              return areaY(marks, { x: "row", y: "value", fill: paint, ariaHidden: "true" });
          }
        }),
      ],
    });

    const gradients = colors.flatMap((color) => color.gradient ?? []);
    if (gradients.length > 0) {
      const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      defs.append(...gradients);
      chart.insertBefore(defs, chart.firstChild);
    }

    chart.part.add("chart");
    chart.setAttribute("role", "img");
    chart.setAttribute("aria-label", describeSeries(seriesElements));
    root.append(chart);
  }
}

customElements.define("chart-view", ChartView);
