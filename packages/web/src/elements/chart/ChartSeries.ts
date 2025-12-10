import type { GlobalHTMLAttributes } from "@/jsx/html-attributes";

export type ChartSeriesType = "BAR" | "LINE" | "AREA";

const DEFAULT_TYPE: ChartSeriesType = "BAR";

export interface ChartSeriesAttributes extends GlobalHTMLAttributes {
  type?: ChartSeriesType;
  color?: string | null;
}

declare global {
  interface HTMLElementTagNameMap {
    "chart-series": ChartSeries;
  }
}

declare module "@/jsx/html-attributes" {
  interface HTMLAttributesByTagName {
    "chart-series": ChartSeriesAttributes;
  }
}

export type DataPoint = number | null;

export default class ChartSeries extends HTMLElement {
  static readonly observedAttributes: (keyof ChartSeriesAttributes)[] = [
    "type",
    "color",
  ] as const;

  type: ChartSeriesType = DEFAULT_TYPE;
  color: string | null = null;
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
      case "color":
        this.color = value;
        break;
    }
  }
}

customElements.define("chart-series", ChartSeries);
