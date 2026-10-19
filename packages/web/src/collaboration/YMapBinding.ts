import * as Y from "yjs";
import { BaseReactive } from "reactivity";

/**
 * A reactive view of a single key on a {@link Y.Map}.
 */
export class BoundField<T> extends BaseReactive<T> {
  private previewValue?: T;

  constructor(
    private readonly map: Y.Map<unknown>,
    private readonly key: string,
    private readonly fallback: T,
  ) {
    super();
  }

  get value(): T {
    if (this.previewValue !== undefined) {
      return this.previewValue;
    }

    const value = this.map.get(this.key);
    return value === undefined ? this.fallback : (value as T);
  }

  /**
   * Updates the value locally and notifies subscribers without writing to the
   * Y.Doc. Used for transient previews (e.g. live drag) where only the
   * committed value should persist. Cleared by the next `value` assignment.
   */
  preview(next: T) {
    this.previewValue = next;
    this.notify();
  }

  set value(next: T) {
    const previewing = this.previewValue !== undefined;
    this.previewValue = undefined;

    if (next === this.map.get(this.key)) {
      if (previewing) {
        this.notify();
      }
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

  constructor(private readonly map: Y.Map<unknown>) {
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

  dispose() {
    this.map.unobserve(this.onMapChange);
    for (const field of this.fields.values()) {
      field.disconnect();
    }
    this.fields.clear();
  }
}
