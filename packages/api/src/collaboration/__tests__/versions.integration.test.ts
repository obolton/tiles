import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as Y from "yjs";
import prisma from "@/database/prisma";
import { buildSectionMap } from "doc/tiles/section";
import { DocWriter } from "../DocWriter";
import { createHocuspocus, docName } from "../server";
import { createEmptyDoc, CURRENT_SCHEMA_VERSION } from "../migrator";
import { AUTO_CHECKPOINT_INTERVAL, LATEST_VERSION_FIELDS } from "../versions";
import { PAGE_DOCUMENT_FIELDS } from "../storage";
import type { FindUniqueQuery } from "@/test/prisma";

const PAGE_ID = "page-1";
const CONTEXT = { userId: "user-1", sessionId: "session-1", pageId: PAGE_ID };

type Server = ReturnType<typeof createHocuspocus>;
type Connection = Awaited<ReturnType<Server["openDirectConnection"]>>;

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

describe("version capture over a live Hocuspocus document", () => {
  let server: Server;
  let connection: Connection;
  let serverDoc: Y.Doc;
  let session: DocWriter;
  let disconnected: boolean;

  beforeEach(async () => {
    vi.mocked(
      prisma.page.findUniqueOrThrow<FindUniqueQuery<typeof PAGE_DOCUMENT_FIELDS>>,
    ).mockResolvedValue({
      document: {
        snapshot: new Uint8Array(Y.encodeStateAsUpdate(createEmptyDoc())),
        schemaVersion: CURRENT_SCHEMA_VERSION,
      },
    });
    vi.mocked(prisma.pageVersion.findFirst).mockResolvedValue(null);

    server = createHocuspocus();
    connection = await server.openDirectConnection(docName(PAGE_ID), CONTEXT);
    if (!connection.document) {
      throw new Error("expected a loaded document");
    }
    serverDoc = connection.document;
    session = new DocWriter(serverDoc);
    disconnected = false;
  });

  afterEach(async () => {
    if (!disconnected) {
      await connection.disconnect();
    }
    server.flushPendingStores();
  });

  test("captures an AUTO version when the first store flushes", async () => {
    session.createTile(buildSectionMap({}));

    server.flushPendingStores();
    await vi.waitFor(() => {
      expect(prisma.pageVersion.create).toHaveBeenCalled();
    });

    const data = createdVersionData();
    expect(data).toMatchObject({
      pageId: PAGE_ID,
      type: "AUTO",
      schemaVersion: CURRENT_SCHEMA_VERSION,
    });

    const restored = new Y.Doc();
    Y.applyUpdate(restored, new Uint8Array(data.snapshot));
    expect(restored.getMap("tiles").size).toBe(1);
  });

  test("skips capture when the latest version matches the flushed state", async () => {
    session.createTile(buildSectionMap({}));
    mockLatestVersion(
      Y.encodeStateVector(serverDoc),
      new Date(Date.now() - AUTO_CHECKPOINT_INTERVAL * 2),
    );

    server.flushPendingStores();
    await vi.waitFor(() => {
      expect(prisma.page.update).toHaveBeenCalled();
    });

    expect(prisma.pageVersion.create).not.toHaveBeenCalled();
  });

  test("a capture failure does not block disconnect and unload", async () => {
    session.createTile(buildSectionMap({}));
    vi.mocked(prisma.pageVersion.findFirst).mockRejectedValue(new Error("db down"));

    disconnected = true;
    await connection.disconnect();

    await vi.waitFor(() => {
      expect(server.documents.has(docName(PAGE_ID))).toBe(false);
    });
    expect(prisma.pageVersion.create).not.toHaveBeenCalled();
  });

  test("captures on disconnect even inside the checkpoint interval", async () => {
    session.createTile(buildSectionMap({}));
    mockLatestVersion(Y.encodeStateVector(new Y.Doc()), new Date());

    disconnected = true;
    await connection.disconnect();

    await vi.waitFor(() => {
      expect(prisma.pageVersion.create).toHaveBeenCalled();
    });
    expect(createdVersionData()).toMatchObject({ type: "AUTO" });
  });
});
