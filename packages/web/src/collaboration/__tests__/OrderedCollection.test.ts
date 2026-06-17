import { beforeEach, describe, expect, test } from "vitest";
import * as Y from "yjs";
import OrderedCollection from "@/collaboration/OrderedCollection";

class Thing {
  readonly id: string;
  disposed = false;

  constructor(id: string, _map: Y.Map<unknown>) {
    this.id = id;
  }

  dispose() {
    this.disposed = true;
  }
}

function seed(map: Y.Map<Y.Map<unknown>>, id: string, order: string) {
  const entry = new Y.Map<unknown>();
  entry.set("order", order);
  map.set(id, entry);
}

describe("OrderedCollection", () => {
  let map: Y.Map<Y.Map<unknown>>;
  let collection: OrderedCollection<Thing>;

  beforeEach(() => {
    map = new Y.Doc().getMap<Y.Map<unknown>>("things");
    // Inserted out of order: "b" before "a".
    seed(map, "b", "b");
    seed(map, "a", "a");
    collection = new OrderedCollection(map, (id, data) => new Thing(id, data));
  });

  test("returns entries sorted by their order field", () => {
    expect(collection.value.map((t) => t.id)).toEqual(["a", "b"]);
  });

  test("places a new entry according to its order", () => {
    seed(map, "m", "a5"); // sorts between "a" and "b"

    expect(collection.value.map((t) => t.id)).toEqual(["a", "m", "b"]);
  });

  test("re-sorts and notifies when an entry's order changes", () => {
    let notified = 0;
    collection.subscribe(() => notified++);

    map.get("a")!.set("order", "z"); // move "a" past "b"

    expect(notified).toBe(1);
    expect(collection.value.map((t) => t.id)).toEqual(["b", "a"]);
  });

  test("does not notify when a non-order field changes", () => {
    let notified = 0;
    collection.subscribe(() => notified++);

    map.get("a")!.set("label", "Alpha");

    expect(notified).toBe(0);
  });

  test("drops and disposes a removed entry", () => {
    const removed = collection.get("a");

    map.delete("a");

    expect(removed.disposed).toBe(true);
    expect(collection.value.map((t) => t.id)).toEqual(["b"]);
  });
});
