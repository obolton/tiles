export interface ToggleEventInit extends EventInit {
  oldState: "open" | "closed";
  newState: "open" | "closed";
}

export default class ToggleEvent extends Event {
  oldState: "open" | "closed";
  newState: "open" | "closed";

  constructor(type: string, options?: ToggleEventInit) {
    const { oldState, newState, ...init } = options ?? {
      oldState: "closed",
      newState: "open",
    };
    super(type, init);
    this.oldState = oldState;
    this.newState = newState;
  }
}
