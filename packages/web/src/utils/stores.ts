export type SubscribeCallback<Value> = (store: BaseStore<Value>) => void;
export type UnsubscribeCallback = () => boolean;
export type Transform<Input, Value> = (input: Input) => Value;

export interface StoreInterface<Value> {
  value: Value;
  subscribe(callback: SubscribeCallback<Value>): UnsubscribeCallback;
  unsubscribe(callback: SubscribeCallback<Value>): void;
  disconnect(): void;
}

export abstract class BaseStore<Value> implements StoreInterface<Value> {
  readonly #subscribers: Set<SubscribeCallback<Value>>;

  constructor() {
    this.#subscribers = new Set<SubscribeCallback<Value>>();
  }

  subscribe(callback: SubscribeCallback<Value>): UnsubscribeCallback {
    this.#subscribers.add(callback);
    return () => this.unsubscribe(callback);
  }

  unsubscribe(callback: SubscribeCallback<Value>) {
    return this.#subscribers.delete(callback);
  }

  disconnect() {
    this.#subscribers.clear();
  }

  protected notify() {
    for (const subscriber of this.#subscribers) {
      subscriber(this);
    }
  }

  abstract get value(): Value;

  derive<DerivedValue>(transform: Transform<[typeof this], DerivedValue>) {
    return new DerivedStore([this], transform);
  }
}

export class Store<Value> extends BaseStore<Value> {
  #value: Value;

  constructor(value: Value) {
    super();
    this.#value = value;
  }

  get value() {
    return this.#value;
  }

  set value(value: Value) {
    if (value === this.#value) {
      return;
    }
    this.#value = value;
    this.notify();
  }
}

export class DerivedStore<
  Input extends StoreInterface<any>[],
  Value,
> extends BaseStore<Value> {
  readonly #input: Input;
  readonly #transform: Transform<Input, Value>;
  readonly #unsubscribeFromInput: UnsubscribeCallback[];

  #value?: Value;
  #stale: boolean;

  constructor(input: Input, transform: Transform<Input, Value>) {
    super();
    this.#input = input;
    this.#transform = transform;
    this.#stale = true;
    this.#unsubscribeFromInput = this.#input.map((input) =>
      input.subscribe(() => this.#markAsStale()),
    );
  }

  #markAsStale() {
    this.#stale = true;
    this.notify();
  }

  get value() {
    if (this.#stale) {
      this.#value = this.#transform(this.#input);
      this.#stale = false;
    }
    return this.#value as Value;
  }

  disconnect() {
    super.disconnect();
    this.#unsubscribeFromInput.forEach((unsubscribe) => unsubscribe());
  }
}
