import { describe, test, expect } from "vitest";
import * as Y from "yjs";
import { applyMigrations, createEmptyDoc, CURRENT_SCHEMA_VERSION } from "../migrator.ts";

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
