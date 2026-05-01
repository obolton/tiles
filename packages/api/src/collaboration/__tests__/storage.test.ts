import { describe, test, expect, vi, beforeEach } from "vitest";
import * as Y from "yjs";
import prisma from "@/database/prisma.ts";
import { loadDoc, saveDoc } from "../storage.ts";
import { createEmptyDoc, CURRENT_SCHEMA_VERSION } from "../migrator.ts";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("loadDoc", () => {
  test("returns an empty migrated doc when no record exists", async () => {
    vi.mocked(prisma.pageDocument.findUnique).mockResolvedValue(null);
    const doc = await loadDoc("page-1");
    expect(doc.getMap("metadata").get("schemaVersion")).toBe(
      CURRENT_SCHEMA_VERSION,
    );
  });

  test("returns the persisted state for an up-to-date snapshot", async () => {
    const source = createEmptyDoc();
    source.getMap("metadata").set("custom", "value");
    const snapshot = Buffer.from(Y.encodeStateAsUpdate(source));
    vi.mocked(prisma.pageDocument.findUnique).mockResolvedValue({
      snapshot,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    } as never);

    const doc = await loadDoc("page-1");

    expect(doc.getMap("metadata").get("custom")).toBe("value");
    expect(doc.getMap("metadata").get("schemaVersion")).toBe(
      CURRENT_SCHEMA_VERSION,
    );
  });

  test("runs pending migrations when the stored schemaVersion is stale", async () => {
    const source = new Y.Doc();
    const snapshot = Buffer.from(Y.encodeStateAsUpdate(source));
    vi.mocked(prisma.pageDocument.findUnique).mockResolvedValue({
      snapshot,
      schemaVersion: 0,
    } as never);

    const doc = await loadDoc("page-1");

    expect(doc.getMap("metadata").get("schemaVersion")).toBe(
      CURRENT_SCHEMA_VERSION,
    );
    expect(typeof doc.getMap("metadata").get("createdAt")).toBe("string");
  });
});

describe("saveDoc", () => {
  test("upserts the state blob with the current schema version", async () => {
    const doc = createEmptyDoc();
    const state = Y.encodeStateAsUpdate(doc);

    await saveDoc("page-1", state);

    expect(prisma.pageDocument.upsert).toHaveBeenCalledWith({
      where: { pageId: "page-1" },
      create: {
        pageId: "page-1",
        snapshot: expect.any(Buffer),
        schemaVersion: CURRENT_SCHEMA_VERSION,
      },
      update: {
        snapshot: expect.any(Buffer),
        schemaVersion: CURRENT_SCHEMA_VERSION,
      },
    });
  });
});
