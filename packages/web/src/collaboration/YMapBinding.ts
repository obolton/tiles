import * as Y from "yjs";
import { BaseReactive } from "@/utils/reactivity";

export const LOCAL_ORIGIN = Symbol("yjs-binding:local");

export class BoundField<T> extends BaseReactive<T> {
  constructor(
    private readonly map: Y.Map<unknown>,
    private readonly key: string,
    private readonly doc: Y.Doc,
  ) {
    super();
  }

  get value(): T {
    return this.map.get(this.key) as T;
  }

  set value(next: T) {
    if (next === this.value) {
      return;
    }

    this.doc.transact(() => this.map.set(this.key, next), LOCAL_ORIGIN);
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
   * Returns a reactive view of `key`.
   */
  field<T>(key: string, initial: T): BoundField<T> {
    if (!this.map.has(key)) {
      this.doc.transact(() => this.map.set(key, initial), LOCAL_ORIGIN);
    }
    let field = this.fields.get(key) as BoundField<T> | undefined;
    if (!field) {
      field = new BoundField<T>(this.map, key, this.doc);
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
