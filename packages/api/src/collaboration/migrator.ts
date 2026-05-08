import * as Y from "yjs";

export const CURRENT_SCHEMA_VERSION = 1;

type Migrator = (doc: Y.Doc) => void;

const migrators: Record<number, Migrator> = {
  1: (doc) => {
    const metadata = doc.getMap("metadata");
    if (!metadata.has("createdAt")) {
      metadata.set("createdAt", new Date().toISOString());
    }
    doc.getMap("tiles");
  },
};

export function applyMigrations(doc: Y.Doc, fromVersion: number) {
  for (
    let version = fromVersion + 1;
    version <= CURRENT_SCHEMA_VERSION;
    version++
  ) {
    const migrator = migrators[version];

    if (!migrator) {
      throw new Error(`No migrator registered for schema version ${version}`);
    }

    doc.transact(() => {
      migrator(doc);
      doc.getMap("metadata").set("schemaVersion", version);
    }, "migration");
  }
}

export function createEmptyDoc(): Y.Doc {
  const doc = new Y.Doc();
  applyMigrations(doc, 0);
  return doc;
}
