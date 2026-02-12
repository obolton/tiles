import { ReactiveValue } from "./value";

export class ReactiveSet<T>
  extends ReactiveValue<Set<T>>
  implements Iterable<T>
{
  get size(): number {
    return this.value.size;
  }

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

  has(item: T) {
    return this.value.has(item);
  }

  add(item: T) {
    this.value.add(item);
    this.notify();
  }

  delete(item: T) {
    const result = this.value.delete(item);
    if (result) {
      this.notify();
    }
    return result;
  }

  toggle(item: T) {
    if (this.value.has(item)) {
      this.value.delete(item);
    } else {
      this.value.add(item);
    }
    this.notify();
  }

  clear() {
    this.value = new Set();
  }

  replace(items: Iterable<T>) {
    this.value = new Set(items);
  }
}

export function set<T>(initialValue?: Iterable<T>) {
  return new ReactiveSet(new Set(initialValue));
}
