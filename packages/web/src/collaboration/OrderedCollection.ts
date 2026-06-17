import * as Y from "yjs";
import Collection, { type CollectionItem } from "./Collection";

/**
 * A {@link Collection} whose entries are kept sorted by the `order` field on
 * the backing `Y.Map`.
 */
export default class OrderedCollection<
  Item extends CollectionItem,
> extends Collection<Item> {
  private cachedValue: readonly Item[] = [];
  private stale = true;
  private readonly onDeepChange = this.handleDeepChange.bind(this);

  constructor(
    map: Y.Map<Y.Map<unknown>>,
    createItem: (id: string, map: Y.Map<unknown>) => Item,
  ) {
    super(map, createItem);
    this.map.observeDeep(this.onDeepChange);
  }

  get value(): readonly Item[] {
    if (this.stale) {
      this.cachedValue = [...this.map.entries()]
        .sort(([, a], [, b]) => (orderOf(a) < orderOf(b) ? -1 : 1))
        .map(([id]) => this.get(id));
      this.stale = false;
    }
    return this.cachedValue;
  }

  notify() {
    this.stale = true;
    super.notify();
  }

  dispose() {
    this.map.unobserveDeep(this.onDeepChange);
    super.dispose();
  }

  private handleDeepChange(events: Y.YEvent<Y.AbstractType<unknown>>[]) {
    const orderChanged = events.some(
      (event) =>
        event instanceof Y.YMapEvent &&
        event.path.length === 1 &&
        event.keysChanged.has("order"),
    );
    if (orderChanged) {
      this.notify();
    }
  }
}

function orderOf(map: Y.Map<unknown>): string {
  return (map.get("order") as string) ?? "";
}
