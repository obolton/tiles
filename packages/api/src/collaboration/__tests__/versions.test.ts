import { describe, test, expect, vi, beforeEach } from "vitest";
import * as Y from "yjs";
import { equalBytes } from "doc/encoding";
import prisma from "@/database/prisma";
import { createEmptyDoc, CURRENT_SCHEMA_VERSION } from "../migrator";
import {
  AUTO_CHECKPOINT_INTERVAL,
  LATEST_VERSION_FIELDS,
  createVersion,
  maybeCreateVersion,
} from "../versions";
import type { FindUniqueQuery } from "@/test/prisma";

const PAGE_ID = "page-1";

function buildDoc(): Y.Doc {
  const doc = createEmptyDoc();
  doc.getMap("tiles").set("tile-1", new Y.Map());
  return doc;
}

function mockLatestVersion(stateVector: Uint8Array, createdAt: Date) {
  vi.mocked(
    prisma.pageVersion.findFirst<FindUniqueQuery<typeof LATEST_VERSION_FIELDS>>,
  ).mockResolvedValue({ id: "version-1", stateVector: new Uint8Array(stateVector), createdAt });
}

function createdVersionData() {
  const call = vi.mocked(prisma.pageVersion.create).mock.calls.at(0);
  if (!call) {
    throw new Error("expected pageVersion.create to be called");
  }
  return call[0].data;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createVersion", () => {
  test("inserts a version row with the encoded document state", async () => {
    const doc = buildDoc();

    await createVersion(PAGE_ID, doc, { type: "NAMED", name: "Launch", userId: "user-1" });

    const data = createdVersionData();
    expect(data).toMatchObject({
      pageId: PAGE_ID,
      type: "NAMED",
      name: "Launch",
      userId: "user-1",
      schemaVersion: CURRENT_SCHEMA_VERSION,
    });

    const restored = new Y.Doc();
    Y.applyUpdate(restored, new Uint8Array(data.snapshot));
    expect(restored.getMap("tiles").size).toBe(1);
    expect(equalBytes(new Uint8Array(data.stateVector), Y.encodeStateVector(doc))).toBe(true);
  });
});

describe("maybeCreateVersion", () => {
  test("creates the first version for a page on store", async () => {
    vi.mocked(prisma.pageVersion.findFirst).mockResolvedValue(null);

    await maybeCreateVersion(PAGE_ID, buildDoc(), "store");

    expect(createdVersionData()).toMatchObject({ pageId: PAGE_ID, type: "AUTO" });
  });

  test("skips when the latest version matches the current state", async () => {
    const doc = buildDoc();
    mockLatestVersion(
      Y.encodeStateVector(doc),
      new Date(Date.now() - AUTO_CHECKPOINT_INTERVAL * 2),
    );

    await maybeCreateVersion(PAGE_ID, doc, "store");
    await maybeCreateVersion(PAGE_ID, doc, "unload");

    expect(prisma.pageVersion.create).not.toHaveBeenCalled();
  });

  test("skips a store capture inside the checkpoint interval", async () => {
    mockLatestVersion(Y.encodeStateVector(new Y.Doc()), new Date());

    await maybeCreateVersion(PAGE_ID, buildDoc(), "store");

    expect(prisma.pageVersion.create).not.toHaveBeenCalled();
  });

  test("captures a store checkpoint once the interval has elapsed", async () => {
    mockLatestVersion(
      Y.encodeStateVector(new Y.Doc()),
      new Date(Date.now() - AUTO_CHECKPOINT_INTERVAL - 1000),
    );

    await maybeCreateVersion(PAGE_ID, buildDoc(), "store");

    expect(createdVersionData()).toMatchObject({ type: "AUTO" });
  });

  test("captures on unload regardless of the interval", async () => {
    mockLatestVersion(Y.encodeStateVector(new Y.Doc()), new Date());

    await maybeCreateVersion(PAGE_ID, buildDoc(), "unload");

    expect(createdVersionData()).toMatchObject({ type: "AUTO" });
  });

  test("propagates persistence errors", async () => {
    vi.mocked(prisma.pageVersion.findFirst).mockRejectedValue(new Error("connection lost"));

    await expect(maybeCreateVersion(PAGE_ID, buildDoc(), "store")).rejects.toThrow(
      "connection lost",
    );
  });
});
