import type { GlobalHTMLAttributes } from "jsx/html-attributes";
import type { GradientDirection } from "@/utils/svg-gradient";

export type ChartSeriesType = "BAR" | "LINE" | "AREA";

const DEFAULT_TYPE: ChartSeriesType = "BAR";

export interface ChartSeriesAttributes extends GlobalHTMLAttributes {
  type?: ChartSeriesType;
  color?: string | null;
  gradient?: GradientDirection | null;
  label?: string | null;
}

declare global {
  interface HTMLElementTagNameMap {
    "chart-series": ChartSeries;
  }
}

declare module "jsx/html-attributes" {
  interface HTMLAttributesByTagName {
    "chart-series": ChartSeriesAttributes;
  }
}

export type DataPoint = number | null;

export default class ChartSeries extends HTMLElement {
  static readonly observedAttributes: (keyof ChartSeriesAttributes)[] = [
    "type",
    "color",
    "gradient",
    "label",
  ] as const;

  type: ChartSeriesType = DEFAULT_TYPE;
  color: string[] = [];
  gradient: GradientDirection | null = null;
  label: string | null = null;
  #values: DataPoint[] = [];

  get values(): DataPoint[] {
    return this.#values;
  }

  set values(values: DataPoint[]) {
    this.#values = values;
    this.dispatchEvent(new Event("serieschange", { bubbles: true }));
  }

  attributeChangedCallback(
    name: keyof ChartSeriesAttributes,
    _: string | null,
    value: string | null,
  ) {
    switch (name) {
      case "type":
        if (typeof value === "string" && value !== "BAR" && value !== "LINE" && value !== "AREA") {
          throw new Error(`Invalid series type: ${value}`);
        }
        this.type = value ?? DEFAULT_TYPE;
        break;
      case "color":
        this.color = value ? value.split(",") : [];
        break;
      case "gradient":
        this.gradient = value as GradientDirection | null;
        break;
      case "label":
        this.label = value;
        break;
    }
  }
}

customElements.define("chart-series", ChartSeries);
