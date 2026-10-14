import { describe, test, expect, vi } from "vitest";
import * as Y from "yjs";
import prisma from "@/database/prisma";
import { loadDoc, saveDoc } from "../storage";
import { createEmptyDoc, CURRENT_SCHEMA_VERSION } from "../migrator";

describe("loadDoc", () => {
  test("returns the persisted state for an up-to-date snapshot", async () => {
    const source = createEmptyDoc();
    source.getMap("metadata").set("custom", "value");
    const snapshot = Buffer.from(Y.encodeStateAsUpdate(source));
    vi.mocked(prisma.page.findUniqueOrThrow).mockResolvedValue({
      document: { snapshot, schemaVersion: CURRENT_SCHEMA_VERSION },
    } as never);

    const doc = await loadDoc("page-1");

    expect(doc.getMap("metadata").get("custom")).toBe("value");
    expect(doc.getMap("metadata").get("schemaVersion")).toBe(CURRENT_SCHEMA_VERSION);
  });

  test("runs pending migrations when the stored schemaVersion is stale", async () => {
    const source = new Y.Doc();
    const snapshot = Buffer.from(Y.encodeStateAsUpdate(source));
    vi.mocked(prisma.page.findUniqueOrThrow).mockResolvedValue({
      document: { snapshot, schemaVersion: 0 },
    } as never);

    const doc = await loadDoc("page-1");

    expect(doc.getMap("metadata").get("schemaVersion")).toBe(CURRENT_SCHEMA_VERSION);
    expect(typeof doc.getMap("metadata").get("createdAt")).toBe("string");
  });

  test("throws when the page does not exist", async () => {
    vi.mocked(prisma.page.findUniqueOrThrow).mockRejectedValue(new Error("Record not found"));

    await expect(loadDoc("missing")).rejects.toThrow("Record not found");
  });
});

describe("saveDoc", () => {
  test("updates the page's document snapshot with the current schema version", async () => {
    const doc = createEmptyDoc();
    const state = Y.encodeStateAsUpdate(doc);

    await saveDoc("page-1", state);

    expect(prisma.page.update).toHaveBeenCalledWith({
      where: { id: "page-1" },
      data: {
        document: {
          update: {
            snapshot: expect.any(Buffer),
            schemaVersion: CURRENT_SCHEMA_VERSION,
          },
        },
      },
    });
  });
});
