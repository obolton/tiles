import css from "./CalendarGrid.css?inline";
import {
  getFirstDayOfWeek,
  getWeekdays,
  getCalendarWeeks,
  isSameDay,
  toISODate,
} from "@/utils/dates";
import { CalendarEvent } from "./events";
import type CalendarDate from "./CalendarDate";
import type ResizeHandle from "@/elements/resize/ResizeHandle";
import type { ResizeEvent } from "@/elements/resize/events";
import type { GlobalHTMLAttributes } from "@/jsx/html-attributes";

interface ItemSegments {
  elements: HTMLElement[];
  slot: HTMLSlotElement;
  startHandle: ResizeHandle | null;
  endHandle: ResizeHandle | null;
}

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
  static observedAttributes = ["year", "month", "editable"];

  private readonly internals: ElementInternals;
  private readonly shadow: ShadowRoot;
  private readonly weeksContainer: HTMLElement;
  private readonly mutationObserver: MutationObserver;
  private readonly firstDayOfWeek: number;

  private weeks: HTMLElement[] = [];
  private segments = new Map<CalendarDate, ItemSegments>();
  private resize: {
    item: CalendarDate;
    edge: "start" | "end";
    start: string;
    end: string;
  } | null = null;
  private select: {
    anchor: string;
    abort: AbortController;
  } | null = null;
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

  get editable(): boolean {
    return this.hasAttribute("editable");
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

  highlightDates(from: string | null, to: string | null = from) {
    const start = from && to && to < from ? to : from;
    const end = from && to && to > from ? to : from;
    for (const day of this.shadow.querySelectorAll<HTMLTimeElement>("time.day")) {
      day.classList.toggle(
        "highlight",
        !!start && day.dateTime >= start && day.dateTime <= (end ?? start),
      );
    }
  }

  constructor() {
    super();
    this.internals = this.attachInternals();
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

    this.shadow.addEventListener("pointerdown", this);
    this.shadow.addEventListener("resizestart", this);
    this.shadow.addEventListener("resizedrag", this);
    this.shadow.addEventListener("resizeend", this);
  }

  handleEvent(event: Event) {
    switch (event.type) {
      case "pointerdown":
        return this.handlePointerDown(event as PointerEvent);
      case "pointermove":
        return this.handlePointerMove(event as PointerEvent);
      case "pointerup":
        return this.handlePointerUp(event as PointerEvent);
      case "resizestart":
        return this.handleResizeStart(event as ResizeEvent);
      case "resizedrag":
        return this.handleResizeDrag(event as ResizeEvent);
      case "resizeend":
        return this.handleResizeEnd(event as ResizeEvent);
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
    this.select?.abort.abort();
    this.select = null;
  }

  attributeChangedCallback(name: string) {
    switch (name) {
      case "year":
      case "month":
        this.updateMonth();
        break;
      case "editable":
        this.layout();
        break;
    }
  }

  private handlePointerDown(event: PointerEvent) {
    if (!this.editable || this.resize) {
      return;
    }
    if (!(event.target instanceof HTMLTimeElement)) {
      return;
    }

    event.preventDefault();

    const abort = new AbortController();
    this.select = { anchor: event.target.dateTime, abort };
    this.highlightDates(this.select.anchor);
    this.internals.states.add("selecting");

    addEventListener("pointermove", this, { signal: abort.signal });
    addEventListener("pointerup", this, { signal: abort.signal });
  }

  private handlePointerMove(event: PointerEvent) {
    if (!this.select) {
      return;
    }

    event.preventDefault();
    const date = this.dateFromPoint(event.clientX, event.clientY);
    if (date) {
      this.highlightDates(this.select.anchor, date);
    }
  }

  private handlePointerUp(event: PointerEvent) {
    if (!this.select) {
      return;
    }

    const { anchor, abort } = this.select;
    const end = this.dateFromPoint(event.clientX, event.clientY) ?? anchor;
    const [start, to] = anchor <= end ? [anchor, end] : [end, anchor];

    abort.abort();
    this.select = null;
    this.highlightDates(null);
    this.internals.states.delete("selecting");

    this.dispatchEvent(
      new CalendarEvent("calendarcellselect", {
        start,
        end: to,
        bubbles: true,
      }),
    );
  }

  private handleResizeStart(event: ResizeEvent) {
    const handle = event.target as ResizeHandle;
    const item = handle.target as CalendarDate | null;
    const edge = handle.dataset.edge as "start" | "end" | undefined;
    if (!item || !edge || !item.start || !item.end) {
      return;
    }

    const { start, end } = item;
    this.resize = { item, edge, start, end };
    this.internals.states.add("resizing");

    item.dispatchEvent(
      new CalendarEvent("calendarmovestart", {
        edge,
        start,
        end,
        clientX: event.clientX,
        clientY: event.clientY,
        bubbles: true,
      }),
    );
  }

  private handleResizeDrag(event: ResizeEvent) {
    if (!this.resize) {
      return;
    }

    event.preventDefault();

    const { item, edge, start, end } = this.resize;
    const targetDate = this.dateFromPoint(event.clientX, event.clientY);
    if (!targetDate) {
      return;
    }
    if (edge === "end" && targetDate < start) {
      return;
    }
    if (edge === "start" && targetDate > end) {
      return;
    }

    const prevDate = edge === "start" ? start : end;

    if (edge === "start") {
      this.resize.start = targetDate;
    } else {
      this.resize.end = targetDate;
    }

    this.previewResize(prevDate, targetDate);

    item.dispatchEvent(
      new CalendarEvent("calendarmovedrag", {
        edge,
        start: this.resize.start,
        end: this.resize.end,
        clientX: event.clientX,
        clientY: event.clientY,
        bubbles: true,
      }),
    );
  }

  private handleResizeEnd(event: ResizeEvent) {
    if (!this.resize) {
      return;
    }

    const { item, edge, start, end } = this.resize;
    this.resize = null;
    this.internals.states.delete("resizing");
    this.layout();

    item.dispatchEvent(
      new CalendarEvent("calendarmoveend", {
        edge,
        start,
        end,
        clientX: event.clientX,
        clientY: event.clientY,
        bubbles: true,
      }),
    );
  }

  private previewResize(prevDate: string, targetDate: string) {
    const { item, edge, start, end } = this.resize!;
    const entry = this.segments.get(item);
    if (!entry) {
      return;
    }

    const prevPos = this.gridPositions.get(prevDate);
    const newPos = this.gridPositions.get(targetDate);
    if (!prevPos || !newPos) {
      return;
    }

    if (edge === "end") {
      for (let w = prevPos.week + 1; w <= newPos.week; w++) {
        this.appendSegment(entry, w);
      }
      for (let w = prevPos.week; w > newPos.week; w--) {
        this.removeLastSegment(entry);
      }
    } else {
      for (let w = prevPos.week - 1; w >= newPos.week; w--) {
        this.prependSegment(entry, w);
      }
      for (let w = prevPos.week; w < newPos.week; w++) {
        this.removeFirstSegment(entry);
      }
    }

    const startPos = this.gridPositions.get(start)!;
    const endPos = this.gridPositions.get(end)!;
    const first = entry.elements[0]!;
    const last = entry.elements[entry.elements.length - 1]!;

    first.style.gridColumn =
      `${startPos.start} / ${first === last ? endPos.end : -1}`;
    for (let i = 1; i < entry.elements.length - 1; i++) {
      entry.elements[i]!.style.gridColumn = "1 / -1";
    }
    if (first !== last) {
      last.style.gridColumn = `1 / ${endPos.end}`;
    }
  }

  private appendSegment(entry: ItemSegments, week: number) {
    const seg = this.createSegment(week, "1 / -1");
    if (entry.endHandle) {
      seg.append(entry.endHandle);
    }
    entry.elements.push(seg);
  }

  private removeLastSegment(entry: ItemSegments) {
    const removed = entry.elements.pop()!;
    if (entry.endHandle) {
      entry.elements[entry.elements.length - 1]!.append(entry.endHandle);
    }
    removed.remove();
  }

  private prependSegment(entry: ItemSegments, week: number) {
    const first = entry.elements[0]!;
    first.classList.remove("primary");

    const seg = this.createSegment(week, "1 / -1");
    seg.classList.add("primary");
    seg.prepend(entry.slot);
    if (entry.startHandle) {
      seg.append(entry.startHandle);
    }
    entry.elements.unshift(seg);
  }

  private removeFirstSegment(entry: ItemSegments) {
    const removed = entry.elements.shift()!;
    const newFirst = entry.elements[0]!;
    newFirst.classList.add("primary");
    newFirst.prepend(entry.slot);
    if (entry.startHandle) {
      newFirst.append(entry.startHandle);
    }
    removed.remove();
  }

  private updateMonth() {
    const dates = getCalendarWeeks(this.year, this.month, this.firstDayOfWeek);
    this.weeks = [];
    this.gridPositions.clear();

    const today = new Date();

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

      this.weeks.push(container);
    }

    this.weeksContainer.replaceChildren(...this.weeks);
    this.layout();
  }

  private layout() {
    if (this.resize) {
      return;
    }

    for (const { elements } of this.segments.values()) {
      for (const el of elements) {
        el.remove();
      }
    }
    this.segments.clear();

    for (const item of this.items) {
      if (!item.start) {
        continue;
      }

      const elements = this.createDateSegments(item.start, item.end);
      if (!elements.length) {
        continue;
      }

      const firstSegment = elements[0]!;
      firstSegment.classList.add("primary");
      const slot = document.createElement("slot");
      firstSegment.prepend(slot);
      slot.assign(item);

      let startHandle: ResizeHandle | null = null;
      let endHandle: ResizeHandle | null = null;

      if (this.editable) {
        startHandle = document.createElement("resize-handle");
        startHandle.direction = "horizontal";
        startHandle.dataset.edge = "start";
        startHandle.target = item;
        firstSegment.append(startHandle);

        endHandle = document.createElement("resize-handle");
        endHandle.direction = "horizontal";
        endHandle.dataset.edge = "end";
        endHandle.target = item;
        elements[elements.length - 1]!.append(endHandle);
      }

      this.segments.set(item, { elements, slot, startHandle, endHandle });
    }
  }

  private createDateSegments(
    startDate: string,
    endDate: string | null,
  ): HTMLElement[] {
    const startPos = this.gridPositions.get(startDate);
    if (!startPos) {
      return [];
    }

    const endPos = endDate ? this.gridPositions.get(endDate) : undefined;
    const segments: HTMLElement[] = [];

    segments.push(
      this.createSegment(
        startPos.week,
        `${startPos.start} / ${this.endColumn(endPos, startPos.week)}`,
      ),
    );

    const lastWeek = endPos ? endPos.week : this.weeks.length - 1;
    for (let w = startPos.week + 1; w <= lastWeek; w++) {
      segments.push(
        this.createSegment(w, `1 / ${this.endColumn(endPos, w)}`),
      );
    }

    return segments;
  }

  private endColumn(
    endPos: { week: number; end: number } | undefined,
    week: number,
  ): number {
    return endPos?.week === week ? endPos.end : -1;
  }

  private createSegment(week: number, gridColumn: string): HTMLElement {
    const segment = document.createElement("div");
    segment.classList.add("segment");
    segment.style.gridColumn = gridColumn;
    this.weeks[week]!.append(segment);
    return segment;
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
