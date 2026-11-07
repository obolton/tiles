import { plot, axisX, axisY, barY, lineY, areaY } from "@observablehq/plot";
import { toCSSColor } from "@/utils/color";
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

interface Size {
  width: number;
  height: number;
}

interface SeriesEntry {
  series: ChartSeries;
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
  const columns = [labels, ...seriesElements.map((series) => series.values)];
  return Math.max(...columns.map((cells) => cells.findLastIndex((cell) => cell != null) + 1));
}

function getSeriesEntry(series: ChartSeries, index: number, palette: readonly string[]) {
  const [first, second] = series.color;
  if (series.gradient && first && second) {
    const gradient = createSVGGradient(`series-gradient-${index}`, series.color, series.gradient);
    return { series, paint: `url(#${gradient.id})`, swatch: toCSSColor(first), gradient };
  }
  // Series without a fill take the next default colour, in a fixed order.
  const paint = first ? toCSSColor(first) : palette[index % palette.length]!;
  return { series, paint, swatch: paint };
}

function createLegendItem({ series, swatch }: SeriesEntry, index: number) {
  const item = document.createElement("li");
  const marker = document.createElement("span");
  marker.className = "swatch";
  marker.style.background = swatch;
  item.append(marker, series.label || `Series ${index + 1}`);
  return item;
}

export default class ChartView extends HTMLElement {
  private readonly legend = document.createElement("ul");
  private readonly frame = document.createElement("div");
  private readonly mutationObserver: MutationObserver;
  private readonly resizeObserver: ResizeObserver;
  private drawScheduled = false;
  private size: Size | null = null;
  #labels: readonly (string | null)[] = [];

  constructor() {
    super();

    const root = this.attachShadow({ mode: "open" });
    root.adoptedStyleSheets.push(stylesheet);
    this.legend.className = "legend";
    this.legend.part.add("legend");
    this.legend.setAttribute("aria-label", "Legend");
    this.legend.hidden = true;
    this.frame.className = "frame";
    root.append(this.legend, this.frame);

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
    this.mutationObserver.observe(this, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["type", "color", "gradient", "label"],
    });
    // The frame's size comes from the observer, so the first draw waits for its notification.
    this.resizeObserver.observe(this.frame);
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

  private resizeObserverCallback(entries: ResizeObserverEntry[]) {
    const box = entries.at(-1)?.contentBoxSize[0];
    if (box) {
      this.size = { width: box.inlineSize, height: box.blockSize };
      this.scheduleDraw();
    }
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

  /** The default series colours: steps selected for the theme's dark or light background. */
  private get palette(): readonly string[] {
    const scheme = getComputedStyle(this).getPropertyValue("--color-scheme").trim();
    return scheme === "dark" ? SERIES_COLORS.dark : SERIES_COLORS.light;
  }

  draw() {
    const seriesElements = Array.from(this.getElementsByTagName("chart-series"));
    const { size, labels } = this;
    if (seriesElements.length === 0 || !size) {
      this.legend.hidden = true;
      this.frame.replaceChildren();
      return;
    }

    const { palette } = this;
    const entries = seriesElements.map((series, index) => getSeriesEntry(series, index, palette));
    this.legend.replaceChildren(...entries.map(createLegendItem));
    this.legend.hidden = entries.length < 2;

    const rows = Array.from({ length: getDataLength(seriesElements, labels) }, (_, index) => index);
    const chart = plot({
      className: "chart",
      width: size.width,
      height: size.height,
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
        ...entries.map(({ series, paint }) => {
          const marks = rows.map((row) => ({ row, value: series.values[row] ?? null }));

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

    const gradients = entries.flatMap((entry) => entry.gradient ?? []);
    if (gradients.length > 0) {
      const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      defs.append(...gradients);
      chart.insertBefore(defs, chart.firstChild);
    }

    chart.part.add("chart");
    chart.setAttribute("role", "img");
    chart.setAttribute("aria-label", describeSeries(seriesElements));
    this.frame.replaceChildren(chart);
  }
}

customElements.define("chart-view", ChartView);
