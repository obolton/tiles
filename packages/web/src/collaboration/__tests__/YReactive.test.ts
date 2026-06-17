import { describe, expect, test, vi } from "vitest";
import * as Y from "yjs";
import YReactive from "../YReactive";

function createMap(): Y.Map<unknown> {
  return new Y.Doc().getMap("data");
}

describe("YReactive", () => {
  test("exposes the Y.js type as its value", () => {
    const map = createMap();
    const reactive = new YReactive(map);
    expect(reactive.value).toBe(map);
  });

  test("notifies on changes while subscribed", () => {
    const map = createMap();
    const reactive = new YReactive(map);
    const subscriber = vi.fn();
    reactive.subscribe(subscriber);
    map.set("key", "value");
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  test("notifies on nested changes", () => {
    const map = createMap();
    const nested = new Y.Map<unknown>();
    map.set("nested", nested);
    const reactive = new YReactive(map);
    const subscriber = vi.fn();
    reactive.subscribe(subscriber);
    nested.set("key", "value");
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  test("notifies once per transaction", () => {
    const map = createMap();
    const reactive = new YReactive(map);
    const subscriber = vi.fn();
    reactive.subscribe(subscriber);
    map.doc!.transact(() => {
      map.set("a", 1);
      map.set("b", 2);
    });
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  test("stops notifying after the last unsubscribe", () => {
    const map = createMap();
    const reactive = new YReactive(map);
    const subscriber = vi.fn();
    const unsubscribe = reactive.subscribe(subscriber);
    unsubscribe();
    map.set("key", "value");
    expect(subscriber).not.toHaveBeenCalled();
  });

  test("resumes notifying when resubscribed", () => {
    const map = createMap();
    const reactive = new YReactive(map);
    reactive.subscribe(vi.fn())();
    const subscriber = vi.fn();
    reactive.subscribe(subscriber);
    map.set("key", "value");
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  test("derived values stay fresh while unsubscribed", () => {
    const map = createMap();
    const reactive = new YReactive(map);
    const size = reactive.derive((value) => value.size);
    expect(size.value).toBe(0);
    map.set("key", "value");
    expect(size.value).toBe(1);
  });

  test("derived values notify while subscribed", () => {
    const map = createMap();
    const reactive = new YReactive(map);
    const size = reactive.derive((value) => value.size);
    const subscriber = vi.fn();
    size.subscribe(subscriber);
    map.set("key", "value");
    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(size.value).toBe(1);
  });
});
