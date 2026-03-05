export interface CalendarGridEventMap {
  calendarcellclick: CalendarGridEvent;
}

declare global {
  interface HTMLElementEventMap extends CalendarGridEventMap {}
}

export interface CalendarGridEventInit extends EventInit {
  date: string;
}

export class CalendarGridEvent extends Event {
  readonly date: string;

  constructor(
    type: keyof CalendarGridEventMap,
    options: CalendarGridEventInit,
  ) {
    super(type, options);
    this.date = options.date;
  }
}
