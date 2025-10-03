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
export type ReactiveTypes<T extends Reactive[]> = {
  [K in keyof T]: ReactiveType<T[K]>;
};

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
    return new Computed<[this], DerivedValue>([this], transform);
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
}

export function array<T>(initialValue: T[]) {
  return new ReactiveArray(initialValue);
}

type Transform<Input extends Reactive[], Value> = (
  ...values: ReactiveTypes<Input>
) => Value;

export class Computed<
  Input extends Reactive[],
  Value,
> extends BaseReactive<Value> {
  private readonly input: Input;
  private readonly transform: Transform<Input, Value>;
  private unsubscribeCallbacks?: UnsubscribeCallback[];

  private inputValues?: ReactiveTypes<Input>; // Used for lazy evaluation when disconnected
  private cachedValue?: Value;
  private stale: boolean;

  constructor(input: Input, transform: Transform<Input, Value>) {
    super();
    this.input = input;
    this.transform = transform;
    this.stale = true;
  }

  subscribe(callback: (reactive: this) => void, signal?: AbortSignal) {
    const result = super.subscribe(callback, signal);
    if (!this.unsubscribeCallbacks && this.subscribers.size > 0) {
      this.unsubscribeCallbacks = this.input.map((reactive) =>
        reactive.subscribe(() => this.markAsStale()),
      );
      this.inputValues = undefined;
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
    this.notify();
  }

  get value() {
    if (!this.unsubscribeCallbacks) {
      const values = this.input.map(
        (input) => input.value,
      ) as ReactiveTypes<Input>;
      const previousValues = this.inputValues;
      const stale = previousValues
        ? previousValues.some((value, i) => values[i] !== value)
        : true;
      if (stale) {
        this.inputValues = values;
        this.cachedValue = this.transform(...values);
        this.stale = false;
      }
    } else if (this.stale) {
      const values = this.input.map(
        (input) => input.value,
      ) as ReactiveTypes<Input>;
      this.cachedValue = this.transform(...values);
      this.stale = false;
    }
    return this.cachedValue as Value;
  }

  disconnect() {
    super.disconnect();
    this.unsubscribeCallbacks?.forEach((unsubscribe) => unsubscribe());
    this.unsubscribeCallbacks = undefined;
  }
}

export function isReactive<T>(
  value: Reactive<T> | unknown,
): value is Reactive<T> {
  return value instanceof BaseReactive;
}

export type ReactiveRecord<T> = {
  [K in keyof T]: Reactive<T[K]>;
};

export function record<T extends Record<string, unknown>>(initialValues: T) {
  const properties: Record<string, Reactive<unknown>> = {};
  for (const [k, v] of Object.entries(initialValues)) {
    properties[k] = reactive(v);
  }
  return properties as ReactiveRecord<T>;
}
