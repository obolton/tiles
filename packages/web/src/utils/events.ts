declare global {
  interface HTMLElementEventMap {
    reorder: ReorderEvent;
    delete: DeleteEvent;
  }
}

export interface ReorderEventInit extends EventInit {
  fromIndex: number;
  toIndex: number;
}

export class ReorderEvent extends Event {
  readonly fromIndex: number;
  readonly toIndex: number;

  constructor(options: ReorderEventInit) {
    super("reorder", { bubbles: true, ...options });
    this.fromIndex = options.fromIndex;
    this.toIndex = options.toIndex;
  }
}

export class DeleteEvent extends Event {
  constructor(options?: EventInit) {
    super("delete", { bubbles: true, ...options });
  }
}
