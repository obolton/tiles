import { beforeEach, describe, expect, test } from "vitest";
import * as Y from "yjs";
import SharedList from "@/collaboration/SharedList";
import { applyListChange, type ListChange } from "reactivity";

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

function seedTitled(target: Y.Map<Y.Map<unknown>>, id: string, title?: string) {
  const entry = new Y.Map<unknown>();
  if (title !== undefined) {
    entry.set("title", title);
  }
  target.set(id, entry);
}

describe("SharedList", () => {
  let doc: Y.Doc;
  let map: Y.Map<Y.Map<unknown>>;
  let collection: SharedList<Thing>;

  beforeEach(() => {
    doc = new Y.Doc();
    map = doc.getMap<Y.Map<unknown>>("things");
    // Inserted out of order: "b" before "a".
    seed(map, "b", "b");
    seed(map, "a", "a");
    collection = new SharedList(map, (id, data) => new Thing(id, data));
  });

  test("returns entries sorted by their order field", () => {
    expect(collection.value.map((t) => t.id)).toEqual(["a", "b"]);
  });

  test("is empty for an empty map", () => {
    const empty = new Y.Doc().getMap<Y.Map<unknown>>("things");
    const list = new SharedList(empty, (id, data) => new Thing(id, data));

    expect(list.value).toEqual([]);
  });

  test("sorts an entry with a malformed order first", () => {
    const broken = new Y.Doc().getMap<Y.Map<unknown>>("things");
    broken.set("no-order", new Y.Map<unknown>()); // missing order → sorts as ""
    seed(broken, "ok", "a");

    const list = new SharedList(broken, (id, data) => new Thing(id, data));

    expect(list.value.map((t) => t.id)).toEqual(["no-order", "ok"]);
  });

  test("reports an add at the entry's sorted position", () => {
    const changes: ListChange<Thing>[] = [];
    collection.subscribe((_, change) => changes.push(change));

    seed(map, "m", "a5"); // sorts between "a" and "b"

    expect(collection.value.map((t) => t.id)).toEqual(["a", "m", "b"]);
    expect(changes).toEqual([
      {
        removed: [],
        added: [{ item: collection.get("m"), index: 1 }],
        moved: [],
      },
    ]);
  });

  test("re-sorts and reports a move when an entry's order changes", () => {
    const changes: ListChange<Thing>[] = [];
    collection.subscribe((_, change) => changes.push(change));

    map.get("a")!.set("order", "z"); // move "a" past "b"

    expect(collection.value.map((t) => t.id)).toEqual(["b", "a"]);
    expect(changes).toEqual([
      {
        removed: [],
        added: [],
        moved: [{ item: collection.get("a"), from: 0, index: 1 }],
      },
    ]);
  });

  test("a move carries its source and resulting positions", () => {
    const changes: ListChange<Thing>[] = [];
    collection.subscribe((_, change) => changes.push(change));

    map.get("b")!.set("order", "0"); // move "b" ahead of "a"

    expect(collection.value.map((t) => t.id)).toEqual(["b", "a"]);
    expect(changes).toEqual([
      {
        removed: [],
        added: [],
        moved: [{ item: collection.get("b"), from: 1, index: 0 }],
      },
    ]);
  });

  test("reports adds and moves together from one transaction", () => {
    const changes: ListChange<Thing>[] = [];
    collection.subscribe((_, change) => changes.push(change));

    doc.transact(() => {
      map.get("a")!.set("order", "z"); // move "a" to the end
      seed(map, "m", "a5"); // add "m" at the front
    });

    expect(collection.value.map((t) => t.id)).toEqual(["m", "b", "a"]);
    expect(changes).toEqual([
      {
        removed: [],
        added: [{ item: collection.get("m"), index: 0 }],
        moved: [{ item: collection.get("a"), from: 0, index: 2 }],
      },
    ]);
  });

  test("does not report a move when an order change preserves position", () => {
    const changes: ListChange<Thing>[] = [];
    collection.subscribe((_, change) => changes.push(change));

    map.get("a")!.set("order", "a0"); // still sorts before "b"

    expect(collection.value.map((t) => t.id)).toEqual(["a", "b"]);
    expect(changes).toEqual([]);
  });

  test("ignores changes to non-order fields", () => {
    const changes: ListChange<Thing>[] = [];
    collection.subscribe((_, change) => changes.push(change));

    map.get("a")!.set("label", "Alpha");

    expect(collection.value.map((t) => t.id)).toEqual(["a", "b"]);
    expect(changes).toEqual([]);
  });

  test("ignores changes nested below an entry", () => {
    // Each entry observes only its own keys, so deeper traffic (e.g. a table
    // row's cells, which live in a nested map) must never wake the collection.
    const cells = new Y.Map<unknown>();
    const entry = new Y.Map<unknown>();
    entry.set("order", "c");
    entry.set("cells", cells);
    map.set("c", entry);

    const changes: ListChange<Thing>[] = [];
    collection.subscribe((_, change) => changes.push(change));

    cells.set("x", "value");

    expect(changes).toEqual([]);
    expect(collection.value.map((t) => t.id)).toEqual(["a", "b", "c"]);
  });

  test("drops, disposes, and reports a remove for a deleted entry", () => {
    const removed = collection.get("a");
    const changes: ListChange<Thing>[] = [];
    collection.subscribe((_, change) => changes.push(change));

    map.delete("a");

    expect(removed.disposed).toBe(true);
    expect(collection.value.map((t) => t.id)).toEqual(["b"]);
    expect(changes).toEqual([{ removed: [{ item: removed, index: 0 }], added: [], moved: [] }]);
  });

  test("reports only a remove when an entry is moved and removed together", () => {
    const removed = collection.get("a");
    const changes: ListChange<Thing>[] = [];
    collection.subscribe((_, change) => changes.push(change));

    doc.transact(() => {
      map.get("a")!.set("order", "z");
      map.delete("a");
    });

    expect(removed.disposed).toBe(true);
    expect(collection.value.map((t) => t.id)).toEqual(["b"]);
    expect(changes).toEqual([{ removed: [{ item: removed, index: 0 }], added: [], moved: [] }]);
  });

  test("reports multiple removes by ascending prior index", () => {
    seed(map, "c", "c");
    seed(map, "d", "d"); // value is now [a, b, c, d]
    const a = collection.get("a");
    const c = collection.get("c");

    let change: ListChange<Thing> | undefined;
    collection.subscribe((_, value) => {
      change = value;
    });

    doc.transact(() => {
      map.delete("a");
      map.delete("c");
    });

    expect(collection.value.map((t) => t.id)).toEqual(["b", "d"]);
    expect(change).toEqual({
      removed: [
        { item: a, index: 0 },
        { item: c, index: 2 },
      ],
      added: [],
      moved: [],
    });
  });

  test("reports several simultaneous moves by ascending new index", () => {
    seed(map, "c", "c");
    seed(map, "d", "d");
    seed(map, "e", "e"); // value is now [a, b, c, d, e]

    let change: ListChange<Thing> | undefined;
    collection.subscribe((_, value) => {
      change = value;
    });

    doc.transact(() => {
      map.get("a")!.set("order", "z"); // move "a" to the end
      map.get("b")!.set("order", "y"); // move "b" just before "a"
    });

    expect(collection.value.map((t) => t.id)).toEqual(["c", "d", "e", "b", "a"]);
    expect(change).toEqual({
      removed: [],
      added: [],
      moved: [
        { item: collection.get("b"), from: 1, index: 3 },
        { item: collection.get("a"), from: 0, index: 4 },
      ],
    });
  });

  test("reports removes, a move, and an add from one transaction", () => {
    seed(map, "c", "c");
    seed(map, "d", "d"); // value is now [a, b, c, d]
    const b = collection.get("b");
    const d = collection.get("d");

    let change: ListChange<Thing> | undefined;
    collection.subscribe((_, value) => {
      change = value;
    });

    doc.transact(() => {
      map.delete("b");
      map.delete("d");
      map.get("a")!.set("order", "z"); // move "a" to the end
      seed(map, "x", "0"); // add "x" at the front
    });

    expect(collection.value.map((t) => t.id)).toEqual(["x", "c", "a"]);
    expect(change).toEqual({
      removed: [
        { item: b, index: 1 },
        { item: d, index: 3 },
      ],
      added: [{ item: collection.get("x"), index: 0 }],
      moved: [{ item: collection.get("a"), from: 0, index: 2 }],
    });
  });

  test("reports only an add when a new entry's order is set in the same transaction", () => {
    const changes: ListChange<Thing>[] = [];
    collection.subscribe((_, change) => changes.push(change));

    doc.transact(() => {
      const entry = new Y.Map<unknown>();
      map.set("c", entry); // integrate first
      entry.set("order", "c"); // order set after integration, same transaction
    });

    expect(collection.value.map((t) => t.id)).toEqual(["a", "b", "c"]);
    expect(changes).toEqual([
      {
        removed: [],
        added: [{ item: collection.get("c"), index: 2 }],
        moved: [],
      },
    ]);
  });

  test("orders colliding orders deterministically by id", () => {
    doc.transact(() => {
      seed(map, "z-id", "m");
      seed(map, "a-id", "m"); // shares "z-id"'s order
    });

    expect(collection.value.map((t) => t.id)).toEqual(["a", "b", "a-id", "z-id"]);
  });

  test("emitted changes replay to reproduce value", () => {
    const replay = collection.value.map((t) => t.id);
    collection.subscribe((_, change) => {
      applyListChange<Thing, void>(change, {
        remove: (_item, index) => {
          replay.splice(index, 1);
        },
        detach: (_item, index) => {
          replay.splice(index, 1);
        },
        insert: (item, index) => {
          replay.splice(index, 0, item.id);
        },
        attach: (item, index) => {
          replay.splice(index, 0, item.id);
        },
      });
    });

    seed(map, "c", "c"); // add
    expect(replay).toEqual(collection.value.map((t) => t.id));

    map.get("a")!.set("order", "z"); // move
    expect(replay).toEqual(collection.value.map((t) => t.id));

    doc.transact(() => {
      map.delete("b"); // remove
      seed(map, "x", "0"); // add
      map.get("c")!.set("order", "aa"); // move that preserves position → filtered
    });
    expect(replay).toEqual(collection.value.map((t) => t.id));
  });

  test("replaces the instance when an entry's value is overwritten", () => {
    const original = collection.get("a");
    const changes: ListChange<Thing>[] = [];
    collection.subscribe((_, change) => changes.push(change));

    const replacement = new Y.Map<unknown>();
    replacement.set("order", "a"); // same order → same position
    map.set("a", replacement); // replaces the existing value ("update")

    expect(original.disposed).toBe(true);
    expect(collection.get("a")).not.toBe(original);
    expect(changes).toEqual([
      {
        removed: [{ item: original, index: 0 }],
        added: [{ item: collection.get("a"), index: 0 }],
        moved: [],
      },
    ]);
  });

  test("clears pending changes when a subscriber throws, leaving the next change clean", () => {
    let failNext = true;
    const changes: ListChange<Thing>[] = [];
    collection.subscribe((_, change) => {
      if (failNext) {
        failNext = false;
        throw new Error("subscriber failed");
      }
      changes.push(change);
    });

    expect(() => seed(map, "c", "c")).toThrow("subscriber failed");

    seed(map, "d", "d");

    expect(changes).toEqual([
      {
        removed: [],
        added: [{ item: collection.get("d"), index: 3 }],
        moved: [],
      },
    ]);
  });

  describe("get", () => {
    test("throws for an unknown id", () => {
      expect(() => collection.get("unknown")).toThrow("Item not found: unknown");
    });
  });

  describe("remove", () => {
    test("deletes and disposes the entry", () => {
      const removed = collection.get("a");

      collection.remove("a");

      expect(removed.disposed).toBe(true);
      expect(collection.value.map((t) => t.id)).toEqual(["b"]);
      expect(() => collection.get("a")).toThrow("Item not found: a");
    });
  });

  describe("sort options", () => {
    test("orders entries by the configured key", () => {
      const titled = new Y.Doc().getMap<Y.Map<unknown>>("things");
      seedTitled(titled, "c", "Cherry");
      seedTitled(titled, "a", "Apple");
      seedTitled(titled, "b", "Banana");

      const sorted = new SharedList(titled, (id, data) => new Thing(id, data), {
        key: "title",
      });

      expect(sorted.value.map((t) => t.id)).toEqual(["a", "b", "c"]);
    });

    test("orders entries with a custom comparator", () => {
      const collator = new Intl.Collator(undefined, { sensitivity: "base" });
      const titled = new Y.Doc().getMap<Y.Map<unknown>>("things");
      seedTitled(titled, "lower", "apple");
      seedTitled(titled, "upper", "APPLE");
      seedTitled(titled, "later", "Banana");

      const sorted = new SharedList(titled, (id, data) => new Thing(id, data), {
        key: "title",
        compare: collator.compare,
      });

      // "apple" and "APPLE" compare equal, so the id tiebreak orders them.
      expect(sorted.value.map((t) => t.id)).toEqual(["lower", "upper", "later"]);
    });

    test("sorts a missing value first", () => {
      const titled = new Y.Doc().getMap<Y.Map<unknown>>("things");
      seedTitled(titled, "a", "Apple");
      seedTitled(titled, "untitled");

      const sorted = new SharedList(titled, (id, data) => new Thing(id, data), {
        key: "title",
      });

      expect(sorted.value.map((t) => t.id)).toEqual(["untitled", "a"]);
    });

    test("re-sorts and reports a move when the configured key changes", () => {
      const doc = new Y.Doc();
      const titled = doc.getMap<Y.Map<unknown>>("things");
      seedTitled(titled, "a", "Apple");
      seedTitled(titled, "b", "Banana");

      const sorted = new SharedList(titled, (id, data) => new Thing(id, data), {
        key: "title",
      });
      const changes: ListChange<Thing>[] = [];
      sorted.subscribe((_, change) => changes.push(change));

      titled.get("a")!.set("title", "Cherry"); // move "a" past "b"

      expect(sorted.value.map((t) => t.id)).toEqual(["b", "a"]);
      expect(changes).toEqual([
        {
          removed: [],
          added: [],
          moved: [{ item: sorted.get("a"), from: 0, index: 1 }],
        },
      ]);
    });
  });

  describe("convergence", () => {
    test("two clients editing concurrently agree on the same order", () => {
      const docA = new Y.Doc();
      const mapA = docA.getMap<Y.Map<unknown>>("things");
      seed(mapA, "a", "a");
      seed(mapA, "b", "b");
      seed(mapA, "c", "c");

      const docB = new Y.Doc();
      Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA));
      const mapB = docB.getMap<Y.Map<unknown>>("things");

      const listA = new SharedList(mapA, (id, data) => new Thing(id, data));
      const listB = new SharedList(mapB, (id, data) => new Thing(id, data));

      // Concurrent inserts into the same gap with a colliding order key.
      seed(mapA, "x", "b5");
      seed(mapB, "y", "b5");

      Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA));
      Y.applyUpdate(docA, Y.encodeStateAsUpdate(docB));

      expect(listA.value.map((t) => t.id)).toEqual(listB.value.map((t) => t.id));
      // Equal orders ("b5") resolve by id, deterministically on both clients.
      expect(listA.value.map((t) => t.id)).toEqual(["a", "b", "x", "y", "c"]);
    });
  });

  describe("dispose", () => {
    test("disposes instances and stops observing membership and order", () => {
      const a = collection.get("a");
      const b = collection.get("b");
      const changes: ListChange<Thing>[] = [];
      collection.subscribe((_, change) => changes.push(change));

      collection.dispose();

      expect(a.disposed).toBe(true);
      expect(b.disposed).toBe(true);
      expect(collection.value).toEqual([]);

      seed(map, "c", "c"); // membership change, no longer observed
      map.get("a")!.set("order", "z"); // order change, child observer detached
      expect(changes).toEqual([]);
    });
  });
});
