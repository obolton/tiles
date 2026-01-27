import { BaseReactive } from "./base";
import type { Reactive } from "./types";

export function isReactive<T>(
  value: Reactive<T> | unknown,
): value is Reactive<T> {
  return value instanceof BaseReactive;
}
