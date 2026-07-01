import * as Y from "yjs";
import { BaseReactive, type SubscribeCallback } from "@/utils/reactivity";

/**
 * A reactive view of a `Y.AbstractType`.
 */
export default class YReactive<T extends Y.AbstractType<any>> extends BaseReactive<T> {
  private observing = false;
  private readonly onDeepChange = this.handleDeepChange.bind(this);

  constructor(private readonly input: T) {
    super();
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

  private handleDeepChange() {
    this.notify();
  }
}
