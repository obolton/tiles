import * as Y from "yjs";
import { BaseReactive, type SubscribeCallback } from "reactivity";

export interface YReactiveOptions {
  /** Whether changes to nested types notify, as well as changes to the type itself. */
  deep?: boolean;
}

/**
 * A reactive view of a `Y.AbstractType`.
 */
export default class YReactive<T extends Y.AbstractType<any>> extends BaseReactive<T> {
  private observing = false;
  private readonly deep: boolean;
  private readonly onDeepChange = this.handleDeepChange.bind(this);

  constructor(
    private readonly input: T,
    { deep = true }: YReactiveOptions = {},
  ) {
    super();
    this.deep = deep;
  }

  get value(): T {
    return this.input;
  }

  subscribe(callback: SubscribeCallback<T>, signal?: AbortSignal) {
    const result = super.subscribe(callback, signal);
    if (!this.observing && this.subscribers.size > 0) {
      this.input.observeDeep(this.onDeepChange);
      this.observing = true;
    }
    return result;
  }

  unsubscribe(callback: SubscribeCallback<T>) {
    const result = super.unsubscribe(callback);
    if (this.subscribers.size === 0) {
      this.disconnect();
    }
    return result;
  }

  disconnect() {
    super.disconnect();
    if (this.observing) {
      this.input.unobserveDeep(this.onDeepChange);
      this.observing = false;
    }
  }

  // Always observes deeply, so a shallow view registered after a deep one (such as the page's tile
  // placement) is still notified after it: Yjs calls shallow observers before deep ones.
  private handleDeepChange(events: Y.YEvent<any>[]) {
    if (this.deep || events.some((event) => event.target === this.input)) {
      this.notify();
    }
  }
}
