import { beforeAll, describe, expect, test } from "vitest";
import * as Y from "yjs";
import { generateKeyBetween } from "jittered-fractional-indexing";
import { getChildren, orderBetween, orderedEntries, type OrderedTile } from "@/placement/ordering";

const a = generateKeyBetween(null, null);
const b = generateKeyBetween(a, null);
const c = generateKeyBetween(b, null);

const siblings: OrderedTile[] = [
  { id: "a", order: a },
  { id: "b", order: b },
  { id: "c", order: c },
];

describe("orderBetween", () => {
  test("returns a valid key for an empty collection", () => {
    const key = orderBetween([], null);
    expect(typeof key).toBe("string");
    expect(key.length).toBeGreaterThan(0);
  });

  test("appends after the last sibling when beforeId is null", () => {
    const key = orderBetween(siblings, null);
    expect(key > c).toBe(true);
  });

  test("appends when beforeId is not found", () => {
    const key = orderBetween(siblings, "missing");
    expect(key > c).toBe(true);
  });

  test("inserts before the first sibling", () => {
    const key = orderBetween(siblings, "a");
    expect(key < a).toBe(true);
  });

  test("inserts between two siblings", () => {
    const key = orderBetween(siblings, "b");
    expect(key > a).toBe(true);
    expect(key < b).toBe(true);
  });

  test("excludes skipId from the comparison", () => {
    // Skipping "a" while inserting before "b": prev becomes undefined, so the
    // key only needs to sort before "b" (not necessarily after "a").
    const key = orderBetween(siblings, "b", "a");
    expect(key < b).toBe(true);
  });

  test("treats beforeId equal to skipId as an append past the rest", () => {
    // Repositioning "c" to before itself: it is skipped, so the key lands
    // after the last remaining sibling ("b"); "c" itself is not compared.
    const key = orderBetween(siblings, "c", "c");
    expect(key > b).toBe(true);
  });
});

describe("getChildren", () => {
  let tiles: Y.Map<Y.Map<unknown>>;

  beforeAll(() => {
    const doc = new Y.Doc();
    tiles = doc.getMap("tiles");

    // Two page-root children, inserted out of order (c before a).
    const rootC = new Y.Map<unknown>();
    rootC.set("parentId", null);
    rootC.set("order", c);
    tiles.set("c", rootC);

    const rootA = new Y.Map<unknown>();
    rootA.set("parentId", null);
    rootA.set("order", a);
    tiles.set("a", rootA);

    // A child of a section.
    const child = new Y.Map<unknown>();
    child.set("parentId", "section-1");
    child.set("order", b);
    tiles.set("child", child);
  });

  test("returns only a parent's children, sorted ascending by order", () => {
    expect(getChildren(tiles, null)).toEqual([
      { id: "a", order: a },
      { id: "c", order: c },
    ]);
  });

  test("selects the children of a section", () => {
    expect(getChildren(tiles, "section-1")).toEqual([{ id: "child", order: b }]);
  });

  test("returns an empty array when the parent has no children", () => {
    expect(getChildren(tiles, "missing")).toEqual([]);
  });

  test("breaks ties by id when children share an order", () => {
    const map = new Y.Doc().getMap<Y.Map<unknown>>("tiles");
    const z = new Y.Map<unknown>();
    z.set("parentId", null);
    z.set("order", a);
    map.set("z", z);
    const x = new Y.Map<unknown>();
    x.set("parentId", null);
    x.set("order", a); // same order as "z"
    map.set("x", x);

    expect(getChildren(map, null).map((child) => child.id)).toEqual(["x", "z"]);
  });

  test("throws when a child has a malformed order", () => {
    const map = new Y.Doc().getMap<Y.Map<unknown>>("tiles");
    const broken = new Y.Map<unknown>();
    broken.set("parentId", null);
    map.set("broken", broken);

    expect(() => getChildren(map, null)).toThrow();
  });
});

describe("orderedEntries", () => {
  let columns: Y.Map<Y.Map<unknown>>;
  let first: Y.Map<unknown>;
  let second: Y.Map<unknown>;

  beforeAll(() => {
    const doc = new Y.Doc();
    columns = doc.getMap("columns");

    // Inserted out of order: the later key first.
    second = new Y.Map<unknown>();
    second.set("order", b);
    columns.set("second", second);

    first = new Y.Map<unknown>();
    first.set("order", a);
    columns.set("first", first);
  });

  test("returns child maps with their ids, sorted ascending by order", () => {
    expect(orderedEntries(columns)).toEqual([
      { id: "first", order: a, map: first },
      { id: "second", order: b, map: second },
    ]);
  });

  test("returns an empty array for an empty map", () => {
    expect(orderedEntries(new Y.Doc().getMap("empty"))).toEqual([]);
  });

  test("breaks ties by id when entries share an order", () => {
    const map = new Y.Doc().getMap<Y.Map<unknown>>("cols");
    const z = new Y.Map<unknown>();
    z.set("order", a);
    map.set("z", z);
    const x = new Y.Map<unknown>();
    x.set("order", a); // same order as "z"
    map.set("x", x);

    expect(orderedEntries(map).map((entry) => entry.id)).toEqual(["x", "z"]);
  });

  test("throws when an entry has a malformed order", () => {
    const map = new Y.Doc().getMap<Y.Map<unknown>>("cols");
    map.set("broken", new Y.Map<unknown>());

    expect(() => orderedEntries(map)).toThrow();
  });
});
