export type CalendarMoveEventType =
  | "calendarmovestart"
  | "calendarmovedrag"
  | "calendarmoveend";

export interface CalendarEventMap {
  calendarcellclick: CalendarGridEvent;
  calendarmovestart: CalendarMoveEvent;
  calendarmovedrag: CalendarMoveEvent;
  calendarmoveend: CalendarMoveEvent;
}

declare global {
  interface HTMLElementEventMap extends CalendarEventMap {}
}

export interface CalendarGridEventInit extends EventInit {
  date: string;
}

export class CalendarGridEvent extends Event {
  readonly date: string;

  constructor(type: "calendarcellclick", options: CalendarGridEventInit) {
    super(type, options);
    this.date = options.date;
  }
}

export interface CalendarMoveEventInit extends EventInit {
  edge: "start" | "end";
  start: string;
  end: string;
  clientX: number;
  clientY: number;
}

export class CalendarMoveEvent extends Event {
  readonly edge: "start" | "end";
  readonly start: string;
  readonly end: string;
  readonly clientX: number;
  readonly clientY: number;

  constructor(type: CalendarMoveEventType, options: CalendarMoveEventInit) {
    super(type, options);
    this.edge = options.edge;
    this.start = options.start;
    this.end = options.end;
    this.clientX = options.clientX;
    this.clientY = options.clientY;
  }
}
