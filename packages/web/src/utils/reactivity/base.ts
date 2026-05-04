import type {
  Reactive,
  ComputedReactive,
  UnsubscribeCallback,
  ReactiveType,
} from "./types";

export abstract class BaseReactive<Value> implements Reactive<Value> {
  protected readonly subscribers = new Set<(reactive: this) => void>();

  subscribe(callback: (reactive: this) => void, signal?: AbortSignal) {
    this.subscribers.add(callback);
    const unsubscriber = () => this.unsubscribe(callback);
    signal?.addEventListener("abort", unsubscriber, {
      passive: true,
      once: true,
    });
    return unsubscriber;
  }

  unsubscribe(callback: (reactive: this) => void) {
    return this.subscribers.delete(callback);
  }

  disconnect() {
    this.subscribers.clear();
  }

  notify() {
    for (const subscriber of this.subscribers) {
      subscriber(this);
    }
  }

  abstract get value(): Value;

  derive<DerivedValue>(
    transform: (input: Value) => DerivedValue,
  ): ComputedReactive<DerivedValue> {
    return new Computed(this, transform);
  }
}

export class Computed<
  Input extends Reactive,
  Value,
> extends BaseReactive<Value> {
  private readonly input: Input;
  private readonly transform: (value: ReactiveType<Input>) => Value;
  private unsubscribeCallback?: UnsubscribeCallback;

  private inputValue?: ReactiveType<Input>; // Used for lazy evaluation when disconnected
  private cachedValue?: Value;
  private stale = true;

  constructor(input: Input, transform: (value: ReactiveType<Input>) => Value) {
    super();
    this.input = input;
    this.transform = transform;
  }

  subscribe(callback: (reactive: this) => void, signal?: AbortSignal) {
    const result = super.subscribe(callback, signal);
    if (!this.unsubscribeCallback && this.subscribers.size > 0) {
      this.unsubscribeCallback = this.input.subscribe(() => this.markAsStale());
      this.inputValue = undefined;
    }
    return result;
  }

  unsubscribe(callback: (reactive: this) => void) {
    const result = super.unsubscribe(callback);
    if (this.subscribers.size === 0) {
      this.disconnect();
    }
    return result;
  }

  markAsStale() {
    this.stale = true;

    if (this.subscribers.size > 0) {
      const previousValue = this.cachedValue;
      if (previousValue !== this.value) {
        this.notify();
      }
    }
  }

  get value() {
    if (!this.unsubscribeCallback) {
      const value = this.input.value as ReactiveType<Input>;
      const previousValue = this.inputValue;
      const stale = previousValue === undefined || previousValue !== value;
      if (stale) {
        this.inputValue = value;
        this.cachedValue = this.transform(value);
        this.stale = false;
      }
    } else if (this.stale) {
      this.cachedValue = this.transform(
        this.input.value as ReactiveType<Input>,
      );
      this.stale = false;
    }
    return this.cachedValue as Value;
  }

  disconnect() {
    super.disconnect();
    this.unsubscribeCallback?.();
    this.unsubscribeCallback = undefined;
  }
}
