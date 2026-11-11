import css from "./CalendarGrid.css?inline";
import leftIcon from "@/icons/arrow-left.svg?raw";
import rightIcon from "@/icons/arrow-right.svg?raw";
import {
  addDays,
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
import type { GlobalHTMLAttributes } from "jsx/html-attributes";

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

declare module "jsx/html-attributes" {
  interface HTMLAttributesByTagName {
    "calendar-grid": CalendarGridAttributes;
  }
}

export default class CalendarGrid extends HTMLElement {
  static observedAttributes = ["year", "month", "editable"];

  private static headingFormatter = new Intl.DateTimeFormat(navigator.language, {
    month: "long",
    year: "numeric",
  });

  private readonly internals: ElementInternals;
  private readonly shadow: ShadowRoot;
  private readonly header: HTMLElement;
  private readonly monthTitle: HTMLHeadingElement;
  private readonly previousButton: HTMLButtonElement;
  private readonly nextButton: HTMLButtonElement;
  private readonly todayButton: HTMLButtonElement;
  private readonly container: HTMLElement;
  private readonly mutationObserver: MutationObserver;
  private readonly resizeObserver: ResizeObserver;
  private readonly firstDayOfWeek: number;

  private weeks: HTMLElement[] = [];
  private segments = new Map<CalendarDate, ItemSegments>();
  private resize: {
    item: CalendarDate;
    edge: "start" | "end";
    start: string;
    end: string;
    height: number;
  } | null = null;
  private select: {
    anchor: string;
    abort: AbortController;
  } | null = null;
  private placeholder: {
    start: string;
    end: string;
    elements: HTMLElement[];
  } | null = null;
  private gridPositions = new Map<string, { week: number; start: number; end: number }>();

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

  dateRangeFromPoint(x: number, y: number, days: number): { start: string; end: string } | null {
    const start = this.dateFromPoint(x, y);
    if (!start) {
      return null;
    }
    const end = days > 0 ? toISODate(addDays(new Date(start), days)) : start;
    return { start, end };
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

  showPlaceholder(start: string, end: string) {
    if (this.placeholder?.start === start && this.placeholder.end === end) {
      return;
    }
    this.hidePlaceholder();
    const elements = this.createDateSegments(start, end);
    for (const el of elements) {
      el.classList.add("placeholder");
    }
    this.placeholder = { start, end, elements };
  }

  hidePlaceholder() {
    if (!this.placeholder) {
      return;
    }
    for (const el of this.placeholder.elements) {
      el.remove();
    }
    this.placeholder = null;
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

    this.previousButton = document.createElement("button");
    this.previousButton.type = "button";
    this.previousButton.ariaLabel = "Previous month";
    this.previousButton.innerHTML = leftIcon;

    this.monthTitle = document.createElement("h2");
    this.monthTitle.id = "title";
    this.monthTitle.ariaLive = "polite";

    this.nextButton = document.createElement("button");
    this.nextButton.type = "button";
    this.nextButton.ariaLabel = "Next month";
    this.nextButton.innerHTML = rightIcon;

    this.todayButton = document.createElement("button");
    this.todayButton.type = "button";
    this.todayButton.ariaLabel = "Go to current month";
    this.todayButton.textContent = "Today";
    this.todayButton.classList.add("today-button");

    this.header = document.createElement("header");
    this.header.id = "header";
    this.header.role = "navigation";
    this.header.ariaLabel = "Calendar navigation";
    this.header.append(this.monthTitle, this.previousButton, this.todayButton, this.nextButton);

    this.container = document.createElement("div");
    this.container.id = "month";
    this.shadow.append(this.header, this.container);

    this.createWeekdayHeaders();

    this.mutationObserver = new MutationObserver(() => this.layout());
    this.resizeObserver = new ResizeObserver((entries) => this.syncSegmentHeights(entries));

    this.shadow.addEventListener("pointerdown", this);
    this.shadow.addEventListener("click", this);
    this.shadow.addEventListener("resizestart", this);
    this.shadow.addEventListener("resizedrag", this);
    this.shadow.addEventListener("resizeend", this);
    this.addEventListener("keydown", this);
  }

  handleEvent(event: Event) {
    switch (event.type) {
      case "click":
        return this.handleClick(event as MouseEvent);
      case "keydown":
        return this.handleKeyDown(event as KeyboardEvent);
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
      attributeFilter: ["start", "end", "style", "label"],
    });
  }

  disconnectedCallback() {
    this.mutationObserver.disconnect();
    this.resizeObserver.disconnect();
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
    if (!this.editable || this.resize || this.select) {
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
    const height = item.offsetHeight;
    this.resize = { item, edge, start, end, height };
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
    if (targetDate === prevDate) {
      return;
    }

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

  private handleClick(event: MouseEvent) {
    switch (event.target) {
      case this.previousButton:
        return this.navigateMonth(-1);
      case this.nextButton:
        return this.navigateMonth(1);
      case this.todayButton:
        return this.navigateToday();
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.target !== this) {
      return;
    }
    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        this.navigateMonth(-1);
        break;
      case "ArrowRight":
        event.preventDefault();
        this.navigateMonth(1);
        break;
    }
  }

  private navigateMonth(delta: number) {
    const date = new Date(this.year, this.month + delta, 1);
    this.setAttribute("year", String(date.getFullYear()));
    this.setAttribute("month", String(date.getMonth() + 1));
  }

  private navigateToday() {
    const today = new Date();
    this.setAttribute("year", String(today.getFullYear()));
    this.setAttribute("month", String(today.getMonth() + 1));
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

  private syncSegmentHeights(entries: ResizeObserverEntry[]) {
    for (const entry of entries) {
      const height = entry.borderBoxSize[0]?.blockSize;
      if (height === undefined) {
        continue;
      }
      const segments = this.segments.get(entry.target as CalendarDate);
      if (!segments) {
        continue;
      }
      for (let i = 1; i < segments.elements.length; i++) {
        segments.elements[i]!.style.minHeight = `${height}px`;
      }
    }
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

    first.style.gridColumn = `${startPos.start} / ${first === last ? endPos.end : -1}`;
    for (let i = 1; i < entry.elements.length - 1; i++) {
      entry.elements[i]!.style.gridColumn = "1 / -1";
    }
    if (first !== last) {
      last.style.gridColumn = `1 / ${endPos.end}`;
    }
  }

  private appendSegment(entry: ItemSegments, week: number) {
    const prev = entry.elements[entry.elements.length - 1]!;
    prev.classList.remove("segment-end");

    const seg = this.createSegment(week, "1 / -1", this.resize?.item);
    seg.classList.add("segment-end");
    if (this.resize) {
      seg.style.minHeight = `${this.resize.height}px`;
    }
    if (entry.endHandle) {
      seg.append(entry.endHandle);
    }
    entry.elements.push(seg);
  }

  private removeLastSegment(entry: ItemSegments) {
    const removed = entry.elements.pop()!;
    const newLast = entry.elements[entry.elements.length - 1]!;
    newLast.classList.add("segment-end");
    if (entry.endHandle) {
      newLast.append(entry.endHandle);
    }
    removed.remove();
  }

  private prependSegment(entry: ItemSegments, week: number) {
    const first = entry.elements[0]!;
    first.classList.remove("primary", "segment-start");
    if (this.resize) {
      first.style.minHeight = `${this.resize.height}px`;
    }

    const seg = this.createSegment(week, "1 / -1");
    seg.classList.add("primary", "segment-start");
    seg.prepend(entry.slot);
    if (entry.startHandle) {
      seg.append(entry.startHandle);
    }
    entry.elements.unshift(seg);
  }

  private removeFirstSegment(entry: ItemSegments) {
    const removed = entry.elements.shift()!;
    const newFirst = entry.elements[0]!;
    newFirst.classList.add("primary", "segment-start");
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

    this.container.replaceChildren(...this.container.querySelectorAll(".weekday"), ...this.weeks);
    this.layout();

    this.monthTitle.textContent = CalendarGrid.headingFormatter.format(
      new Date(this.year, this.month),
    );
    this.todayButton.disabled =
      this.year === today.getFullYear() && this.month === today.getMonth();
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
    this.resizeObserver.disconnect();

    for (const item of this.items) {
      if (!item.start) {
        continue;
      }

      const elements = this.createDateSegments(item.start, item.end, item);
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

      if (elements.length > 1) {
        this.resizeObserver.observe(item);
      }
    }
  }

  private createDateSegments(
    startDate: string,
    endDate: string | null,
    item?: CalendarDate,
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
      segments.push(this.createSegment(w, `1 / ${this.endColumn(endPos, w)}`, item));
    }

    segments[0]?.classList.add("segment-start");
    segments[segments.length - 1]?.classList.add("segment-end");

    return segments;
  }

  private endColumn(endPos: { week: number; end: number } | undefined, week: number): number {
    return endPos?.week === week ? endPos.end : -1;
  }

  private createSegment(week: number, gridColumn: string, item?: CalendarDate): HTMLElement {
    const segment = document.createElement("div");
    segment.classList.add("segment");
    segment.style.gridColumn = gridColumn;

    if (item) {
      segment.style.cssText += item.style.cssText;
      const label = item.getAttribute("label");
      if (label) {
        const span = document.createElement("span");
        span.classList.add("label");
        span.textContent = label;
        segment.append(span);
      }
    }

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
      this.container.append(element);
    }
  }
}

customElements.define("calendar-grid", CalendarGrid);
