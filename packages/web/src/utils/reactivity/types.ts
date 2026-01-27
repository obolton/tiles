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
