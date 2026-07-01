import * as Y from "yjs";
import { BaseReactive, type ListChange } from "@/utils/reactivity";

export interface SharedListItem {
  dispose(): void;
}

export interface SortOptions {
  key: string;
  compare?: (a: string, b: string) => number;
}

const ORDER: SortOptions = { key: "order" };

/**
 * A reactive list backed by a `Y.Map`, transforming each entry into a model instance, with configurable ordering.
 */
export default class SharedList<Item extends SharedListItem> extends BaseReactive<
  readonly Item[],
  ListChange<Item>
> {
  private readonly instances = new Map<string, Item>();
  private items: readonly Item[] = [];
  private readonly index = new Map<Item, number>();
  private readonly onChange = this.handleChange.bind(this);

  private readonly childMaps = new Map<string, Y.Map<unknown>>();
  private readonly childItems = new Map<Y.Map<unknown>, Item>();
  private readonly onChildChange = this.handleChildChange.bind(this);

  private readonly pendingAdds = new Set<Item>();
  private readonly pendingMoves = new Set<Item>();
  private readonly pendingRemoves = new Set<Item>();
  private flushScheduled = false;
  private readonly flush = this.flushChanges.bind(this);

  constructor(
    private readonly map: Y.Map<Y.Map<unknown>>,
    private readonly createItem: (id: string, map: Y.Map<unknown>) => Item,
    private readonly sort: SortOptions = ORDER,
  ) {
    super();
    for (const [id, data] of this.map) {
      this.observeChild(id, data, this.add(id, data));
    }
    this.setItems(this.computeItems());
    this.map.observe(this.onChange);
  }

  get value(): readonly Item[] {
    return this.items;
  }

  get(id: string): Item {
    const item = this.instances.get(id);
    if (!item) {
      throw new Error(`Item not found: ${id}`);
    }
    return item;
  }

  remove(id: string) {
    this.map.delete(id);
  }

  dispose() {
    this.map.unobserve(this.onChange);
    for (const child of this.childMaps.values()) {
      child.unobserve(this.onChildChange);
    }
    this.childMaps.clear();
    this.childItems.clear();
    this.map.doc?.off("afterTransaction", this.flush);
    this.flushScheduled = false;
    this.clearPending();
    for (const item of this.instances.values()) {
      item.dispose();
    }
    this.instances.clear();
    this.setItems([]);
    this.disconnect();
  }

  private add(id: string, data: Y.Map<unknown>): Item {
    const existing = this.instances.get(id);
    if (existing) {
      return existing;
    }
    const item = this.createItem(id, data);
    this.instances.set(id, item);
    return item;
  }

  private computeItems(): Item[] {
    const { key, compare = lexicographic } = this.sort;
    const entries: { id: string; item: Item; value: string }[] = [];
    for (const [id, child] of this.map) {
      const raw = child.get(key);
      entries.push({
        id,
        item: this.get(id),
        value: typeof raw === "string" ? raw : "",
      });
    }
    entries.sort((a, b) => compareEntries(a, b, compare));
    return entries.map((entry) => entry.item);
  }

  private setItems(items: readonly Item[]) {
    this.items = items;
    this.index.clear();
    for (const [i, item] of items.entries()) {
      this.index.set(item, i);
    }
  }

  private indexOf(item: Item): number {
    const index = this.index.get(item);
    if (index === undefined) {
      throw new RangeError("Item not in index");
    }
    return index;
  }

  private reconcile(event: Y.YMapEvent<Y.Map<unknown>>): {
    added: { id: string; item: Item; data: Y.Map<unknown> }[];
    removed: { id: string; item: Item }[];
  } {
    const added: { id: string; item: Item; data: Y.Map<unknown> }[] = [];
    const removed: { id: string; item: Item }[] = [];
    for (const [id, change] of event.changes.keys) {
      if (change.action === "add") {
        const data = this.map.get(id);
        if (data) {
          added.push({ id, item: this.add(id, data), data });
        }
      } else if (change.action === "update") {
        const previous = this.instances.get(id);
        if (previous) {
          previous.dispose();
          this.instances.delete(id);
          removed.push({ id, item: previous });
        }
        const data = this.map.get(id);
        if (data) {
          added.push({ id, item: this.add(id, data), data });
        }
      } else if (change.action === "delete") {
        const item = this.instances.get(id);
        if (item) {
          item.dispose();
          this.instances.delete(id);
          removed.push({ id, item });
        }
      }
    }
    return { added, removed };
  }

  private emitChange(
    removedItems: Iterable<Item>,
    addedItems: Iterable<Item>,
    movedItems: Iterable<Item> = [],
  ) {
    const removed = Array.from(removedItems, (item) => ({
      item,
      index: this.indexOf(item),
    })).sort((a, b) => a.index - b.index);
    const movedFrom = Array.from(movedItems, (item) => ({
      item,
      from: this.indexOf(item),
    }));

    this.setItems(this.computeItems());

    const added = Array.from(addedItems, (item) => ({
      item,
      index: this.indexOf(item),
    })).sort((a, b) => a.index - b.index);
    const moved = movedFrom
      .map(({ item, from }) => ({
        item,
        from,
        index: this.indexOf(item),
      }))
      .filter(({ from, index }) => from !== index)
      .sort((a, b) => a.index - b.index);

    if (removed.length === 0 && added.length === 0 && moved.length === 0) {
      return;
    }
    this.notify({ removed, added, moved });
  }

  private handleChange(event: Y.YMapEvent<Y.Map<unknown>>) {
    const { added, removed } = this.reconcile(event);
    for (const { id, item } of removed) {
      this.unobserveChild(id);
      this.pendingMoves.delete(item);
      this.pendingRemoves.add(item);
    }
    for (const { id, item, data } of added) {
      this.observeChild(id, data, item);
      this.pendingAdds.add(item);
    }
    if (added.length > 0 || removed.length > 0) {
      this.schedule();
    }
  }

  private observeChild(id: string, child: Y.Map<unknown>, item: Item) {
    if (this.childMaps.has(id)) {
      return;
    }
    this.childMaps.set(id, child);
    this.childItems.set(child, item);
    child.observe(this.onChildChange);
  }

  private unobserveChild(id: string) {
    const child = this.childMaps.get(id);
    if (!child) {
      return;
    }
    child.unobserve(this.onChildChange);
    this.childMaps.delete(id);
    this.childItems.delete(child);
  }

  private handleChildChange(event: Y.YMapEvent<unknown>) {
    if (!event.keysChanged.has(this.sort.key)) {
      return;
    }
    const item = this.childItems.get(event.target);
    if (item) {
      this.pendingMoves.add(item);
      this.schedule();
    }
  }

  private schedule() {
    if (this.flushScheduled) {
      return;
    }
    this.flushScheduled = true;
    this.map.doc?.on("afterTransaction", this.flush);
  }

  private flushChanges() {
    this.map.doc?.off("afterTransaction", this.flush);
    this.flushScheduled = false;

    const moved = this.pendingMoves.difference(this.pendingAdds);

    if (this.pendingRemoves.size === 0 && this.pendingAdds.size === 0 && moved.size === 0) {
      return;
    }

    const removed = new Set(this.pendingRemoves);
    const added = new Set(this.pendingAdds);
    this.clearPending();

    this.emitChange(removed, added, moved);
  }

  private clearPending() {
    this.pendingAdds.clear();
    this.pendingMoves.clear();
    this.pendingRemoves.clear();
  }
}

function lexicographic(a: string, b: string): number {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
}

function compareEntries(
  a: { id: string; value: string },
  b: { id: string; value: string },
  compare: (a: string, b: string) => number,
): number {
  const order = compare(a.value, b.value);
  if (order !== 0) {
    return order;
  }
  if (a.id < b.id) {
    return -1;
  }
  if (a.id > b.id) {
    return 1;
  }
  return 0;
}
