import { describe, test, expect } from "vitest";
import * as Y from "yjs";
import {
  applyMigrations,
  createEmptyDoc,
  migrateSnapshot,
  CURRENT_SCHEMA_VERSION,
} from "../migrator";

describe("createEmptyDoc", () => {
  test("returns a doc stamped at the current schema version", () => {
    const doc = createEmptyDoc();
    const metadata = doc.getMap("metadata");
    expect(metadata.get("schemaVersion")).toBe(CURRENT_SCHEMA_VERSION);
    expect(typeof metadata.get("createdAt")).toBe("string");
    expect(doc.getMap("tiles").size).toBe(0);
  });
});

describe("applyMigrations", () => {
  test("is a no-op when fromVersion equals currentSchemaVersion", () => {
    const doc = createEmptyDoc();
    const before = Y.encodeStateAsUpdate(doc);
    applyMigrations(doc, CURRENT_SCHEMA_VERSION);
    const after = Y.encodeStateAsUpdate(doc);
    expect(after).toEqual(before);
  });

  test("preserves existing createdAt when re-running v1 from version 0", () => {
    const doc = createEmptyDoc();
    const original = doc.getMap("metadata").get("createdAt");
    applyMigrations(doc, 0);
    expect(doc.getMap("metadata").get("createdAt")).toBe(original);
  });
});

describe("migrateSnapshot", () => {
  test("returns the snapshot untouched when already at the current version", () => {
    const snapshot = Y.encodeStateAsUpdate(createEmptyDoc());
    expect(migrateSnapshot(snapshot, CURRENT_SCHEMA_VERSION)).toBe(snapshot);
  });

  test("migrates a stale snapshot to the current schema", () => {
    const snapshot = Y.encodeStateAsUpdate(new Y.Doc());

    const migrated = migrateSnapshot(snapshot, 0);

    const doc = new Y.Doc();
    Y.applyUpdate(doc, migrated);
    expect(doc.getMap("metadata").get("schemaVersion")).toBe(CURRENT_SCHEMA_VERSION);
    expect(typeof doc.getMap("metadata").get("createdAt")).toBe("string");
  });

  test("preserves existing content while migrating", () => {
    const source = new Y.Doc();
    source.getMap("tiles").set("tile-1", "content");

    const migrated = migrateSnapshot(Y.encodeStateAsUpdate(source), 0);

    const doc = new Y.Doc();
    Y.applyUpdate(doc, migrated);
    expect(doc.getMap("tiles").get("tile-1")).toBe("content");
    expect(doc.getMap("metadata").get("schemaVersion")).toBe(CURRENT_SCHEMA_VERSION);
  });
});
