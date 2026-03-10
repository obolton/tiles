export type CalendarEventType =
  | "calendarcellselect"
  | "calendarmovestart"
  | "calendarmovedrag"
  | "calendarmoveend";

export interface CalendarEventMap {
  calendarcellselect: CalendarEvent;
  calendarmovestart: CalendarEvent;
  calendarmovedrag: CalendarEvent;
  calendarmoveend: CalendarEvent;
}

declare global {
  interface HTMLElementEventMap extends CalendarEventMap {}
}

export interface CalendarEventInit extends EventInit {
  start: string;
  end: string;
  edge?: "start" | "end";
  clientX?: number;
  clientY?: number;
}

export class CalendarEvent extends Event {
  readonly start: string;
  readonly end: string;
  readonly edge?: "start" | "end";
  readonly clientX: number;
  readonly clientY: number;

  constructor(type: CalendarEventType, options: CalendarEventInit) {
    super(type, options);
    this.start = options.start;
    this.end = options.end;
    this.edge = options.edge;
    this.clientX = options.clientX ?? 0;
    this.clientY = options.clientY ?? 0;
  }
}
