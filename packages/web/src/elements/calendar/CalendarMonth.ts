import css from "./CalendarMonth.css?inline";
import { getFirstDayOfWeek, getDaysInMonth } from "@/utils/dates";
import type { GlobalHTMLAttributes } from "@/jsx/html-attributes";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export interface CalendarMonthAttributes extends GlobalHTMLAttributes {
  date?: string;
}

declare global {
  interface HTMLElementTagNameMap {
    "calendar-month": CalendarMonth;
  }
}

declare module "@/jsx/html-attributes" {
  interface HTMLAttributesByTagName {
    "calendar-month": CalendarMonthAttributes;
  }
}

export default class CalendarMonth extends HTMLElement {
  static readonly observedAttributes: (keyof CalendarMonthAttributes)[] = ["date"] as const;

  // Date formatters
  private static monthFormatter = new Intl.DateTimeFormat(navigator.language, {
    month: "long",
  });
  private static weekDayFormatter = new Intl.DateTimeFormat(navigator.language, {
    weekday: "narrow",
  });
  private static dayFormatter = new Intl.DateTimeFormat(navigator.language, {
    day: "numeric",
  });

  private header: HTMLElement;
  private dates: HTMLElement;

  private getDate() {
    const attribute = this.getAttribute("date");
    return attribute ? new Date(attribute) : new Date();
  }

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "closed" });
    shadow.adoptedStyleSheets = [stylesheet];

    this.header = document.createElement("header");
    this.dates = document.createElement("section");
    shadow.append(this.header, this.dates);
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name: keyof CalendarMonthAttributes) {
    switch (name) {
      case "date":
        this.render();
        break;
    }
  }

  render() {
    const highlightDate = this.getDate();
    const items = document.createDocumentFragment();

    // Header
    this.header.textContent = CalendarMonth.monthFormatter.format(highlightDate);

    // Weekdays
    const firstDayOfWeek = getFirstDayOfWeek();
    const headerDate = new Date(highlightDate);
    headerDate.setDate(highlightDate.getDate() - highlightDate.getDay() + firstDayOfWeek);
    for (let i = 0; i < 7; i++) {
      const weekday = document.createElement("div");
      weekday.textContent = CalendarMonth.weekDayFormatter.format(headerDate);
      weekday.classList.add("weekday");
      items.append(weekday);

      headerDate.setDate(headerDate.getDate() + 1);
    }

    // Dates
    const firstDayOfMonth = new Date(highlightDate.getFullYear(), highlightDate.getMonth(), 1);
    const columnOffset = ((firstDayOfMonth.getDay() - firstDayOfWeek + 7) % 7) + 1;
    const date = new Date(highlightDate.getFullYear(), highlightDate.getMonth(), 1);
    for (let j = 1; j <= getDaysInMonth(highlightDate); j++) {
      date.setDate(j);

      const day = document.createElement("time");
      day.textContent = CalendarMonth.dayFormatter.format(date);
      day.classList.add("date");
      if (j === highlightDate.getDate()) {
        day.classList.add("highlighted-date");
      }
      if (j === 1) {
        day.style.setProperty("grid-column-start", `${columnOffset}`);
      }
      day.setAttribute("datetime", date.toISOString().split("T")[0] ?? "");
      items.append(day);
    }

    this.dates.replaceChildren(items);
  }
}

customElements.define("calendar-month", CalendarMonth);
