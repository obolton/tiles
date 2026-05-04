import * as Y from "yjs";
import { BaseReactive } from "@/utils/reactivity";

export const LOCAL_ORIGIN = Symbol("yjs-binding:local");

/**
 * A reactive view of a single key on a {@link Y.Map}.
 */
export class BoundField<T> extends BaseReactive<T> {
  constructor(
    private readonly map: Y.Map<unknown>,
    private readonly key: string,
    private readonly fallback: T,
  ) {
    super();
  }

  get value(): T {
    const value = this.map.get(this.key);
    return value === undefined ? this.fallback : (value as T);
  }

  set value(next: T) {
    if (next === this.value) {
      return;
    }

    this.map.set(this.key, next);
  }
}

/**
 * Wraps a {@link Y.Map} and exposes its keys as typed reactive fields.
 */
export class YMapBinding {
  private readonly fields = new Map<string, BoundField<unknown>>();

  constructor(
    private readonly map: Y.Map<unknown>,
    private readonly doc: Y.Doc,
  ) {
    this.onMapChange = this.onMapChange.bind(this);
    map.observe(this.onMapChange);
  }

  private onMapChange(event: Y.YMapEvent<unknown>) {
    for (const key of event.keysChanged) {
      this.fields.get(key)?.notify();
    }
  }

  /**
   * Returns a reactive view of a key in the map.
   */
  field<T>(key: string, fallback: T): BoundField<T> {
    let field = this.fields.get(key) as BoundField<T> | undefined;

    if (!field) {
      field = new BoundField<T>(this.map, key, fallback);
      this.fields.set(key, field as BoundField<unknown>);
    }

    return field;
  }

  transact<R>(fn: () => R, origin: unknown = LOCAL_ORIGIN): R {
    return this.doc.transact(fn, origin);
  }

  dispose() {
    this.map.unobserve(this.onMapChange);
    for (const field of this.fields.values()) {
      field.disconnect();
    }
    this.fields.clear();
  }
}
