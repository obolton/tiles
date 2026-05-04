import * as Y from "yjs";
import { describe, expect, test, beforeEach, vi } from "vitest";
import { YMapBinding, BoundField, LOCAL_ORIGIN } from "../YMapBinding";

describe("YMapBinding", () => {
  let doc: Y.Doc;
  let map: Y.Map<unknown>;
  let binding: YMapBinding;

  beforeEach(() => {
    doc = new Y.Doc();
    map = doc.getMap<unknown>("test");
    binding = new YMapBinding(map, doc);
  });

  describe("field", () => {
    test("returns a BoundField", () => {
      expect(binding.field("x", 1)).toBeInstanceOf(BoundField);
    });

    test("returns the same instance on repeat calls", () => {
      const first = binding.field("x", 1);
      const second = binding.field("x", 99);
      expect(second).toBe(first);
    });

    test("does not eagerly write to the map", () => {
      binding.field("x", 5);
      expect(map.has("x")).toBe(false);
    });
  });

  describe("BoundField.value getter", () => {
    test("returns the fallback when the key is absent", () => {
      const field = binding.field("x", 7);
      expect(field.value).toBe(7);
    });

    test("returns the live map value when the key is present", () => {
      map.set("x", 42);
      const field = binding.field("x", 0);
      expect(field.value).toBe(42);
    });

    test("reflects external map updates", () => {
      const field = binding.field("x", 0);
      expect(field.value).toBe(0);
      map.set("x", 99);
      expect(field.value).toBe(99);
    });
  });

  describe("BoundField.value setter", () => {
    test("writes through to the map", () => {
      const field = binding.field("x", 0);
      field.value = 42;
      expect(map.get("x")).toBe(42);
    });

    test("notifies subscribers when the value changes", () => {
      const field = binding.field("x", 0);
      const sub = vi.fn();
      field.subscribe(sub);
      field.value = 1;
      expect(sub).toHaveBeenCalledTimes(1);
    });

    test("does not notify when set to the current fallback value", () => {
      const field = binding.field("x", 1);
      const sub = vi.fn();
      field.subscribe(sub);
      field.value = 1;
      expect(sub).toHaveBeenCalledTimes(0);
    });

    test("does not notify when set to the current live value", () => {
      map.set("x", 5);
      const field = binding.field("x", 0);
      const sub = vi.fn();
      field.subscribe(sub);
      field.value = 5;
      expect(sub).toHaveBeenCalledTimes(0);
    });

    test("notifies subscribers when the map changes externally", () => {
      const field = binding.field("x", 0);
      const sub = vi.fn();
      field.subscribe(sub);
      map.set("x", 1);
      expect(sub).toHaveBeenCalledTimes(1);
    });

    test("subscribers respect AbortSignal", () => {
      const field = binding.field("x", 0);
      const sub = vi.fn();
      const controller = new AbortController();
      field.subscribe(sub, controller.signal);
      field.value = 1;
      expect(sub).toHaveBeenCalledTimes(1);
      controller.abort();
      field.value = 2;
      expect(sub).toHaveBeenCalledTimes(1);
    });
  });

  describe("remote updates", () => {
    test("notifies subscribers when a remote update arrives", () => {
      const fieldA = binding.field<number>("x", 0);

      const docB = new Y.Doc();
      const mapB = docB.getMap<unknown>("test");
      Y.applyUpdate(docB, Y.encodeStateAsUpdate(doc));

      const sub = vi.fn();
      fieldA.subscribe(sub);

      mapB.set("x", 42);
      Y.applyUpdate(doc, Y.encodeStateAsUpdate(docB));

      expect(sub).toHaveBeenCalledTimes(1);
      expect(fieldA.value).toBe(42);
    });
  });

  describe("transact", () => {
    test("collapses multiple writes into one Yjs transaction", () => {
      const x = binding.field("x", 0);
      const y = binding.field("y", 0);

      let txnCount = 0;
      doc.on("afterTransaction", () => {
        txnCount++;
      });

      binding.transact(() => {
        x.value = 1;
        y.value = 2;
      });

      expect(txnCount).toBe(1);
      expect(x.value).toBe(1);
      expect(y.value).toBe(2);
    });

    test("notifies each changed field's subscribers exactly once", () => {
      const x = binding.field("x", 0);
      const y = binding.field("y", 0);
      const subX = vi.fn();
      const subY = vi.fn();
      x.subscribe(subX);
      y.subscribe(subY);

      binding.transact(() => {
        x.value = 1;
        y.value = 2;
      });

      expect(subX).toHaveBeenCalledTimes(1);
      expect(subY).toHaveBeenCalledTimes(1);
    });

    test("forwards a custom origin to the Yjs transaction", () => {
      const customOrigin = Symbol("custom");
      const origins: unknown[] = [];
      doc.on("afterTransaction", (tr: Y.Transaction) =>
        origins.push(tr.origin),
      );
      const field = binding.field("x", 0);
      binding.transact(() => {
        field.value = 1;
      }, customOrigin);
      expect(origins).toContain(customOrigin);
    });

    test("defaults to LOCAL_ORIGIN", () => {
      const origins: unknown[] = [];
      doc.on("afterTransaction", (tr: Y.Transaction) =>
        origins.push(tr.origin),
      );
      const field = binding.field("x", 0);
      binding.transact(() => {
        field.value = 1;
      });
      expect(origins).toContain(LOCAL_ORIGIN);
    });
  });

  describe("dispose", () => {
    test("stops notifying subscribers after dispose", () => {
      const field = binding.field("x", 0);
      const sub = vi.fn();
      field.subscribe(sub);

      binding.dispose();
      map.set("x", 99);

      expect(sub).toHaveBeenCalledTimes(0);
    });
  });
});
