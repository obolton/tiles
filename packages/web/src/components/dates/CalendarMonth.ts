import stylesheet from "./CalendarMonth.css?url";
import { getFirstDayOfWeek, getDaysInMonth } from "@/utils/dates";

export default class CalendarMonth extends HTMLElement {
  static observedAttributes = ["date"] as const;

  private shadow: ShadowRoot;
  private root: HTMLElement;
  private header: HTMLElement;
  private dates: HTMLElement;
  private monthFormatter: Intl.DateTimeFormat;
  private weekDayFormatter: Intl.DateTimeFormat;
  private dayFormatter: Intl.DateTimeFormat;

  private getDate() {
    const attribute = this.getAttribute("date");
    return attribute ? new Date(attribute) : new Date();
  }

  constructor() {
    super();

    this.shadow = this.attachShadow({ mode: "closed" });

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = stylesheet;
    this.shadow.append(link);

    this.root = document.createElement("section");
    this.root.id = "root";

    this.header = document.createElement("header");

    this.dates = document.createElement("section");
    this.dates.id = "dates";

    this.root.append(this.header, this.dates);

    this.shadow.append(link, this.root);

    this.monthFormatter = new Intl.DateTimeFormat(navigator.language, {
      month: "long",
    });
    this.weekDayFormatter = new Intl.DateTimeFormat(navigator.language, {
      weekday: "narrow",
    });
    this.dayFormatter = new Intl.DateTimeFormat(navigator.language, {
      day: "numeric",
    });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(
    name: (typeof CalendarMonth.observedAttributes)[number],
  ) {
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
    this.header.textContent = this.monthFormatter.format(highlightDate);

    // Weekdays
    const firstDayOfWeek = getFirstDayOfWeek();
    const headerDate = new Date(highlightDate);
    headerDate.setDate(
      highlightDate.getDate() - highlightDate.getDay() + firstDayOfWeek,
    );
    for (let i = 0; i < 7; i++) {
      const weekday = document.createElement("div");
      weekday.textContent = this.weekDayFormatter.format(headerDate);
      weekday.classList.add("weekday");
      items.append(weekday);

      headerDate.setDate(headerDate.getDate() + 1);
    }

    // Dates
    const firstDayOfMonth = new Date(
      highlightDate.getFullYear(),
      highlightDate.getMonth(),
      1,
    );
    const columnOffset =
      ((firstDayOfMonth.getDay() - firstDayOfWeek + 7) % 7) + 1;
    const date = new Date(
      highlightDate.getFullYear(),
      highlightDate.getMonth(),
      1,
    );
    for (let j = 1; j <= getDaysInMonth(highlightDate); j++) {
      date.setDate(j);

      const day = document.createElement("time");
      day.textContent = this.dayFormatter.format(date);
      day.classList.add("date");
      if (j === highlightDate.getDate()) {
        day.classList.add("highlighted-date");
      }
      if (j === 1) {
        day.style.setProperty("grid-column-start", `${columnOffset}`);
      }
      day.setAttribute("datetime", date.toISOString().split("T")[0]);
      items.append(day);
    }

    this.dates.replaceChildren(items);
  }
}
