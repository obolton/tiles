import { ReactiveValue } from "./value";

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
