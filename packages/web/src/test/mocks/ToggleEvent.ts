export interface ToggleEventInit extends EventInit {
  oldState: "open" | "closed";
  newState: "open" | "closed";
  source?: Element | null;
}

export default class ToggleEvent extends Event {
  oldState: "open" | "closed";
  newState: "open" | "closed";
  source: Element | null;

  constructor(type: string, options?: ToggleEventInit) {
    const { oldState, newState, source, ...init } = options ?? {
      oldState: "closed",
      newState: "open",
    };
    super(type, init);
    this.oldState = oldState;
    this.newState = newState;
    this.source = source ?? null;
  }
}
