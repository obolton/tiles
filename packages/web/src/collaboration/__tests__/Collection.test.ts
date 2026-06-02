import { beforeEach, describe, expect, test } from "vitest";
import * as Y from "yjs";
import Collection from "@/collaboration/Collection";

interface CreateThingInput {
  label: string;
}

class Thing {
  readonly id: string;
  readonly label: string;
  disposed = false;

  static createMap(input: CreateThingInput): Y.Map<unknown> {
    const map = new Y.Map<unknown>();
    map.set("label", input.label);
    return map;
  }

  constructor(id: string, map: Y.Map<unknown>) {
    this.id = id;
    this.label = map.get("label") as string;
  }

  dispose() {
    this.disposed = true;
  }
}

/** Attaches a Thing entry to a doc-backed map so its values are readable. */
function seed(map: Y.Map<Y.Map<unknown>>, id: string, label: string) {
  map.set(id, Thing.createMap({ label }));
}

describe("Collection", () => {
  let map: Y.Map<Y.Map<unknown>>;
  let collection: Collection<Thing>;

  beforeEach(() => {
    map = new Y.Doc().getMap<Y.Map<unknown>>("things");
    collection = new Collection(map, (id, data) => new Thing(id, data));
  });

  describe("constructor", () => {
    test("seeds an instance for each existing entry", () => {
      seed(map, "a", "Alpha");
      seed(map, "b", "Beta");

      const seeded = new Collection(map, (id, data) => new Thing(id, data));

      expect(seeded.value.map((t) => t.id)).toEqual(["a", "b"]);
    });
  });

  describe("create", () => {
    test("adds an instance to the collection", () => {
      const thing = collection.create(Thing.createMap({ label: "Alpha" }));

      expect(thing.id).toBeTruthy();
      expect(thing.label).toBe("Alpha");
      expect(collection.value).toContain(thing);
      expect(collection.get(thing.id)).toBe(thing);
    });
  });

  describe("get", () => {
    test("throws for an unknown id", () => {
      expect(() => collection.get("unknown")).toThrow(
        "Item not found: unknown",
      );
    });
  });

  describe("remove", () => {
    test("removes and disposes the instance", () => {
      const thing = collection.create(Thing.createMap({ label: "Alpha" }));

      collection.remove(thing.id);

      expect(thing.disposed).toBe(true);
      expect(collection.value).not.toContain(thing);
      expect(() => collection.get(thing.id)).toThrow(
        `Item not found: ${thing.id}`,
      );
    });
  });

  describe("observer", () => {
    test("adds an instance when an entry appears externally", () => {
      seed(map, "c", "Gamma");

      expect(collection.get("c").label).toBe("Gamma");
    });

    test("disposes the instance when an entry is deleted externally", () => {
      const thing = collection.create(Thing.createMap({ label: "Alpha" }));

      map.delete(thing.id);

      expect(thing.disposed).toBe(true);
      expect(collection.value).toEqual([]);
    });
  });

  describe("dispose", () => {
    test("disposes every instance and stops observing", () => {
      const thing = collection.create(Thing.createMap({ label: "Alpha" }));

      collection.dispose();

      expect(thing.disposed).toBe(true);

      // Further map changes are no longer reconciled.
      seed(map, "late", "Late");
      expect(collection.value).toEqual([]);
    });
  });
});
