import type { GlobalHTMLAttributes } from "jsx/html-attributes";

export interface MapPointAttributes extends GlobalHTMLAttributes {
  lat?: number | null;
  long?: number | null;
}

declare global {
  interface HTMLElementTagNameMap {
    "map-point": MapPoint;
  }
}

declare module "jsx/html-attributes" {
  interface HTMLAttributesByTagName {
    "map-point": MapPointAttributes;
  }
}

export default class MapPoint extends HTMLElement {
  static observedAttributes = ["lat", "long"];

  get lat(): number {
    return parseFloat(this.getAttribute("lat") ?? "0");
  }

  set lat(value: number) {
    this.setAttribute("lat", String(value));
  }

  get long(): number {
    return parseFloat(this.getAttribute("long") ?? "0");
  }

  set long(value: number) {
    this.setAttribute("long", String(value));
  }
}

customElements.define("map-point", MapPoint);
