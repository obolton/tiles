// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface StoreInterface<T = any> {
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
  ): StoreInterface<V>;
}

export type SubscribeCallback<T> = (store: StoreInterface<T>) => void;
export type UnsubscribeCallback = () => boolean;

export type StoreValue<T extends StoreInterface> = T["value"];
export type StoreValues<T extends StoreInterface[]> = {
  [K in keyof T]: StoreValue<T[K]>;
};

export abstract class BaseStore<Value> implements StoreInterface<Value> {
  protected readonly subscribers = new Set<(store: this) => void>();

  subscribe(callback: (store: this) => void, signal?: AbortSignal) {
    this.subscribers.add(callback);
    const unsubscriber = () => this.unsubscribe(callback);
    signal?.addEventListener("abort", unsubscriber, {
      passive: true,
      once: true,
    });
    return unsubscriber;
  }

  unsubscribe(callback: (store: this) => void) {
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
    signal?: AbortSignal,
  ): StoreInterface<DerivedValue> {
    return new DerivedStore<[this], DerivedValue>([this], transform, signal);
  }
}

export class Store<Value> extends BaseStore<Value> {
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

type Transform<Input extends StoreInterface[], Value> = (
  ...values: StoreValues<Input>
) => Value;

export class DerivedStore<
  Input extends StoreInterface[],
  Value,
> extends BaseStore<Value> {
  private readonly input: Input;
  private readonly transform: Transform<Input, Value>;
  private readonly unsubscribeCallbacks: UnsubscribeCallback[];

  private cachedValue?: Value;
  private stale: boolean;

  constructor(
    input: Input,
    transform: Transform<Input, Value>,
    signal?: AbortSignal,
  ) {
    super();
    this.input = input;
    this.transform = transform;
    this.stale = true;
    this.unsubscribeCallbacks = this.input.map((store) =>
      store.subscribe(() => this.markAsStale(), signal),
    );
  }

  private markAsStale() {
    this.stale = true;
    this.notify();
  }

  get value() {
    if (this.stale) {
      const values = this.input.map(
        (input) => input.value,
      ) as StoreValues<Input>;
      this.cachedValue = this.transform(...values);
      this.stale = false;
    }
    return this.cachedValue as Value;
  }

  disconnect() {
    super.disconnect();
    this.unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe());
  }
}

export function isStore<T>(
  value: StoreInterface<T> | unknown,
): value is StoreInterface<T> {
  return value instanceof BaseStore;
}
