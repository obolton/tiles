import * as Y from "yjs";
import { BaseReactive } from "@/utils/reactivity";

export interface CollectionItem {
  dispose(): void;
}

/**
 * A reactive collection backed by a `Y.Map`.
 */
export default class Collection<
  Item extends CollectionItem,
> extends BaseReactive<Item[]> {
  private readonly instances = new Map<string, Item>();
  private readonly onMapChange = this.reconcile.bind(this);

  constructor(
    private readonly map: Y.Map<Y.Map<unknown>>,
    private readonly createItem: (id: string, map: Y.Map<unknown>) => Item,
  ) {
    super();
    for (const [id, data] of this.map.entries()) {
      this.add(id, data);
    }
    this.map.observe(this.onMapChange);
  }

  get value(): Item[] {
    return [...this.instances.values()];
  }

  get(id: string): Item {
    const item = this.instances.get(id);
    if (!item) {
      throw new Error(`Item not found: ${id}`);
    }
    return item;
  }

  create(entry: Y.Map<unknown>): Item {
    const id = crypto.randomUUID();
    this.map.set(id, entry);
    return this.instances.get(id) ?? this.add(id, entry);
  }

  remove(id: string) {
    this.map.delete(id);
  }

  private add(id: string, data: Y.Map<unknown>): Item {
    const item = this.createItem(id, data);
    this.instances.set(id, item);
    return item;
  }

  private reconcile(event: Y.YMapEvent<Y.Map<unknown>>) {
    for (const [id, change] of event.changes.keys) {
      if (change.action === "add") {
        const data = this.map.get(id);
        if (data && !this.instances.has(id)) {
          this.add(id, data);
        }
      } else if (change.action === "delete") {
        this.instances.get(id)?.dispose();
        this.instances.delete(id);
      }
    }
    this.notify();
  }

  dispose() {
    this.map.unobserve(this.onMapChange);
    for (const item of this.instances.values()) {
      item.dispose();
    }
    this.instances.clear();
    this.disconnect();
  }
}
