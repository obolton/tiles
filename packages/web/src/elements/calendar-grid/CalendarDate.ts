import type { GlobalHTMLAttributes } from "jsx/html-attributes";

export interface CalendarDateAttributes extends GlobalHTMLAttributes {
  start?: string | null;
  end?: string | null;
  label?: string | null;
}

declare global {
  interface HTMLElementTagNameMap {
    "calendar-date": CalendarDate;
  }
}

declare module "jsx/html-attributes" {
  interface HTMLAttributesByTagName {
    "calendar-date": CalendarDateAttributes;
  }
}

export default class CalendarDate extends HTMLElement {
  static observedAttributes = ["start", "end"];

  #start: Date | null = null;
  #end: Date | null = null;

  attributeChangedCallback(name: string, _old: string | null, value: string | null) {
    switch (name) {
      case "start":
        this.#start = value ? new Date(value + "T00:00:00") : null;
        break;
      case "end":
        this.#end = value ? new Date(value + "T00:00:00") : null;
        break;
    }
  }

  get start(): string | null {
    return this.getAttribute("start");
  }

  set start(value: string | null) {
    if (value) {
      this.setAttribute("start", value);
    } else {
      this.removeAttribute("start");
    }
  }

  get end(): string | null {
    return this.getAttribute("end") ?? this.getAttribute("start");
  }

  set end(value: string | null) {
    if (value) {
      this.setAttribute("end", value);
    } else {
      this.removeAttribute("end");
    }
  }

  get startDate(): Date | null {
    return this.#start;
  }

  get endDate(): Date | null {
    return this.#end ?? this.#start;
  }
}

customElements.define("calendar-date", CalendarDate);
