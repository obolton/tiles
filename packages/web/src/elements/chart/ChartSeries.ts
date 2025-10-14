declare global {
  interface HTMLElementTagNameMap {
    "chart-series": ChartSeries;
  }
}

declare module "@/jsx/jsx" {
  namespace JSX {
    interface IntrinsicElements {
      "chart-series": JSX.Attributes<ChartSeries & ChartSeriesAttributes>;
    }
  }
}

export type ChartSeriesType = "BAR" | "LINE" | "AREA";

const DEFAULT_TYPE: ChartSeriesType = "BAR";

export interface ChartSeriesAttributes {
  type: ChartSeriesType;
}

export type DataPoint = number | null;

export default class ChartSeries extends HTMLElement {
  static readonly observedAttributes: (keyof ChartSeriesAttributes)[] = [
    "type",
  ] as const;

  type: ChartSeriesType = DEFAULT_TYPE;
  values: DataPoint[] = [];

  attributeChangedCallback(
    name: keyof ChartSeriesAttributes,
    _: string | null,
    value: string | null,
  ) {
    switch (name) {
      case "type":
        if (
          typeof value === "string" &&
          value !== "BAR" &&
          value !== "LINE" &&
          value !== "AREA"
        ) {
          throw new Error(`Invalid series type: ${value}`);
        }
        this.type = value ?? DEFAULT_TYPE;
        break;
    }
  }
}

customElements.define("chart-series", ChartSeries);
