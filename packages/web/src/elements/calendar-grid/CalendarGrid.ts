import css from "./CalendarGrid.css?inline";
import {
  getFirstDayOfWeek,
  getWeekdays,
  getCalendarWeeks,
  isSameDay,
  toISODate,
} from "@/utils/dates";
import { CalendarGridEvent } from "./events";
import type { GlobalHTMLAttributes } from "@/jsx/html-attributes";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export interface CalendarGridAttributes extends GlobalHTMLAttributes {
  year?: number;
  month?: number;
  editable?: boolean;
}

declare global {
  interface HTMLElementTagNameMap {
    "calendar-grid": CalendarGrid;
  }
}

declare module "@/jsx/html-attributes" {
  interface HTMLAttributesByTagName {
    "calendar-grid": CalendarGridAttributes;
  }
}

export default class CalendarGrid extends HTMLElement {
  static observedAttributes = ["year", "month"];

  private readonly shadow: ShadowRoot;
  private readonly weeksContainer: HTMLElement;
  private readonly mutationObserver: MutationObserver;
  private readonly firstDayOfWeek: number;

  private weeks: { container: HTMLElement; slot: HTMLSlotElement }[] = [];
  private continuations: HTMLElement[] = [];
  private highlighted: HTMLTimeElement | null = null;
  private gridPositions = new Map<
    string,
    { week: number; start: number; end: number }
  >();

  get year(): number {
    return Number(this.getAttribute("year")) || new Date().getFullYear();
  }

  get month(): number {
    const attr = this.getAttribute("month");
    return attr ? Number(attr) - 1 : new Date().getMonth();
  }

  get items() {
    return Array.from(this.getElementsByTagName("calendar-date"));
  }

  dateFromPoint(x: number, y: number): string | null {
    for (const el of this.shadow.elementsFromPoint(x, y)) {
      if (el instanceof HTMLTimeElement) {
        return el.dateTime;
      }
    }
    return null;
  }

  highlightDate(date: string | null) {
    if (this.highlighted?.dateTime === date) {
      return;
    }

    this.highlighted?.classList.remove("highlight");

    if (!date) {
      this.highlighted = null;
      return;
    }

    this.highlighted = this.shadow.querySelector<HTMLTimeElement>(
      `time[datetime="${date}"]`,
    );
    this.highlighted?.classList.add("highlight");
  }

  constructor() {
    super();
    this.shadow = this.attachShadow({
      mode: "closed",
      slotAssignment: "manual",
    });
    this.shadow.adoptedStyleSheets = [stylesheet];
    this.firstDayOfWeek = getFirstDayOfWeek();

    this.createWeekdayHeaders();

    this.weeksContainer = document.createElement("div");
    this.weeksContainer.classList.add("weeks");
    this.shadow.append(this.weeksContainer);

    this.mutationObserver = new MutationObserver(() => this.layout());

    this.shadow.addEventListener("click", this);
  }

  handleEvent(event: Event) {
    switch (event.type) {
      case "click":
        return this.handleClick(event);
    }
  }

  connectedCallback() {
    this.updateMonth();
    this.mutationObserver.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["start", "end"],
    });
  }

  disconnectedCallback() {
    this.mutationObserver.disconnect();
  }

  attributeChangedCallback(name: string) {
    switch (name) {
      case "year":
      case "month":
        this.updateMonth();
        break;
    }
  }

  private handleClick(event: Event) {
    if (event.target instanceof HTMLTimeElement) {
      this.dispatchEvent(
        new CalendarGridEvent("calendarcellclick", {
          date: event.target.dateTime,
          bubbles: true,
        }),
      );
    }
  }

  private updateMonth() {
    const dates = getCalendarWeeks(this.year, this.month, this.firstDayOfWeek);
    this.weeks = [];
    this.gridPositions.clear();
    this.highlighted = null;

    const today = new Date();
    const fragment = document.createDocumentFragment();

    for (let w = 0; w < dates.length; w++) {
      const container = document.createElement("div");
      container.classList.add("week");

      for (let d = 0; d < 7; d++) {
        const date = dates[w]![d]!;
        const element = document.createElement("time");
        element.classList.add("day");
        element.dateTime = toISODate(date);
        element.style.gridColumn = `${d + 1} / ${d + 2}`;

        if (date.getMonth() !== this.month) {
          element.classList.add("outside");
        }

        const label = String(date.getDate());
        if (isSameDay(date, today)) {
          element.classList.add("today");
          const span = document.createElement("span");
          span.textContent = label;
          element.append(span);
        } else {
          element.textContent = label;
        }

        container.append(element);
        this.gridPositions.set(element.dateTime, {
          week: w,
          start: d + 1,
          end: d + 2,
        });
      }

      const slot = document.createElement("slot");
      container.append(slot);
      this.weeks.push({ container, slot });

      fragment.append(container);
    }

    this.weeksContainer.replaceChildren(fragment);
    this.layout();
  }

  private layout() {
    for (const el of this.continuations) {
      el.remove();
    }
    this.continuations = [];

    const slotItems: Element[][] = this.weeks.map(() => []);

    for (const item of this.items) {
      const start = item.start;
      if (!start) {
        continue;
      }

      const position = this.gridPositions.get(start);
      if (!position) {
        continue;
      }

      const endPos = item.end ? this.gridPositions.get(item.end) : undefined;

      item.style.gridColumn = `${position.start} / ${this.endColumn(endPos, position.week)}`;
      slotItems[position.week]!.push(item);

      const lastWeek = endPos ? endPos.week : this.weeks.length - 1;
      for (let w = position.week + 1; w <= lastWeek; w++) {
        this.createContinuation(w, `1 / ${this.endColumn(endPos, w)}`);
      }
    }

    for (let w = 0; w < this.weeks.length; w++) {
      this.weeks[w]!.slot.assign(...slotItems[w]!);
    }
  }

  private endColumn(
    endPos: { week: number; end: number } | undefined,
    week: number,
  ): number {
    return endPos?.week === week ? endPos.end : -1;
  }

  private createContinuation(week: number, gridColumn: string) {
    const continuation = document.createElement("div");
    continuation.classList.add("continuation");
    continuation.style.gridColumn = gridColumn;
    this.weeks[week]!.container.append(continuation);
    this.continuations.push(continuation);
  }

  private createWeekdayHeaders() {
    const short = getWeekdays("short");
    const long = getWeekdays("long");

    for (let i = 0; i < 7; i++) {
      const element = document.createElement("abbr");
      element.classList.add("weekday");
      element.textContent = short[i]!;
      element.title = long[i]!;
      element.style.gridRow = "header";
      element.style.gridColumn = String(i + 1);
      this.shadow.append(element);
    }
  }
}

customElements.define("calendar-grid", CalendarGrid);
