// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Reactive<T = any> {
  value: T;
  subscribe(
    callback: SubscribeCallback<T>,
    signal?: AbortSignal,
  ): UnsubscribeCallback;
  unsubscribe(callback: SubscribeCallback<T>): void;
  disconnect(): void;
  derive<V>(
    transform: (input: T) => V,
    signal?: AbortSignal,
  ): ComputedReactive<V>;
}

export interface ComputedReactive<T> extends Reactive<T> {
  readonly value: T;
  markAsStale(): void;
}

export type SubscribeCallback<T> = (reactive: Reactive<T>) => void;
export type UnsubscribeCallback = () => boolean;

export type ReactiveType<T extends Reactive> = T["value"];

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

  protected notify() {
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

export class ReactiveValue<Value> extends BaseReactive<Value> {
  private cachedValue: Value;

  constructor(value: Value) {
    super();
    this.cachedValue = value;
  }

  get value() {
    return this.cachedValue;
  }

  set value(value: Value) {
    if (value === this.cachedValue) {
      return;
    }
    this.cachedValue = value;
    this.notify();
  }
}

export function reactive<Value>(initialValue: Value) {
  return new ReactiveValue(initialValue);
}

export class ReactiveFlag extends ReactiveValue<boolean> {
  on() {
    this.value = true;
  }

  off() {
    this.value = false;
  }

  toggle() {
    this.value = !this.value;
  }
}

export function flag(initialValue: boolean) {
  return new ReactiveFlag(initialValue);
}

export class ReactiveArray<T>
  extends ReactiveValue<T[]>
  implements Iterable<T>
{
  [Symbol.iterator]() {
    return this.value[Symbol.iterator]();
  }

  entries() {
    return this.value.entries();
  }

  keys() {
    return this.value.keys();
  }

  values() {
    return this.value.values();
  }

  find(...args: Parameters<typeof this.value.find>) {
    return this.value.find(...args);
  }

  findIndex(...args: Parameters<typeof this.value.findIndex>) {
    return this.value.findIndex(...args);
  }

  push(...args: Parameters<typeof this.value.push>) {
    const result = this.value.push(...args);
    this.notify();
    return result;
  }

  splice(...args: Parameters<typeof this.value.splice>) {
    const result = this.value.splice(...args);
    this.notify();
    return result;
  }
}

export function array<T>(initialValue: T[]) {
  return new ReactiveArray(initialValue);
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

type ReactiveInputs = Record<string, Reactive>;

type CombinedValue<T extends ReactiveInputs> = {
  [K in keyof T]: ReactiveType<T[K]>;
};

export class Combined<T extends ReactiveInputs> extends BaseReactive<
  CombinedValue<T>
> {
  private readonly inputs: T;
  private unsubscribeCallbacks?: UnsubscribeCallback[];

  private cachedValue?: CombinedValue<T>;
  private stale = true;

  constructor(inputs: T) {
    super();
    this.inputs = inputs;
  }

  subscribe(callback: (reactive: this) => void, signal?: AbortSignal) {
    const result = super.subscribe(callback, signal);
    if (!this.unsubscribeCallbacks && this.subscribers.size > 0) {
      this.unsubscribeCallbacks = Object.values(this.inputs).map((input) =>
        input.subscribe(() => this.markAsStale()),
      );
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

  private markAsStale() {
    this.stale = true;

    if (this.subscribers.size > 0) {
      this.notify();
    }
  }

  get value(): CombinedValue<T> {
    if (this.stale || !this.unsubscribeCallbacks) {
      const result = {} as CombinedValue<T>;
      for (const [key, input] of Object.entries(this.inputs)) {
        result[key as keyof T] = input.value;
      }
      this.cachedValue = result;
      this.stale = false;
    }
    return this.cachedValue as CombinedValue<T>;
  }

  disconnect() {
    super.disconnect();
    this.unsubscribeCallbacks?.forEach((unsubscribe) => unsubscribe());
    this.unsubscribeCallbacks = undefined;
  }
}

export function combine<T extends ReactiveInputs>(inputs: T): Combined<T> {
  return new Combined(inputs);
}

export function isReactive<T>(
  value: Reactive<T> | unknown,
): value is Reactive<T> {
  return value instanceof BaseReactive;
}

export type ReactiveRecord<T, P extends PropertyKey = never> = {
  [K in keyof T]: K extends P ? T[K] : Reactive<T[K]>;
};

export function record<T extends Record<string, unknown>>(initialValues: T) {
  const properties: Record<string, Reactive<unknown>> = {};
  for (const [k, v] of Object.entries(initialValues)) {
    properties[k] = reactive(v);
  }
  return properties as ReactiveRecord<T>;
}
