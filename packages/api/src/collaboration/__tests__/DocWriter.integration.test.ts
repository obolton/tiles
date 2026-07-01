import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as Y from "yjs";
import prisma from "@/database/prisma.ts";
import { AI_ORIGIN } from "doc/origins";
import { buildSectionMap } from "doc/tiles/section";
import { buildTextMap } from "doc/tiles/text";
import { DocWriter } from "../DocWriter.ts";
import { createHocuspocus, docName } from "../server.ts";
import { createEmptyDoc, CURRENT_SCHEMA_VERSION } from "../migrator.ts";

const PAGE_ID = "page-1";
const CONTEXT = { userId: "user-1", sessionId: "session-1", pageId: PAGE_ID };

type Server = ReturnType<typeof createHocuspocus>;
type Connection = Awaited<ReturnType<Server["openDirectConnection"]>>;

function tiles(doc: Y.Doc): Y.Map<Y.Map<unknown>> {
  return doc.getMap<Y.Map<unknown>>("tiles");
}

describe("DocWriter over a live Hocuspocus document", () => {
  let server: Server;
  let connection: Connection;
  let serverDoc: Y.Doc;
  let session: DocWriter;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(prisma.page.findUniqueOrThrow).mockResolvedValue({
      document: {
        snapshot: Buffer.from(Y.encodeStateAsUpdate(createEmptyDoc())),
        schemaVersion: CURRENT_SCHEMA_VERSION,
      },
    } as never);

    server = createHocuspocus();
    connection = await server.openDirectConnection(docName(PAGE_ID), CONTEXT);
    if (!connection.document) {
      throw new Error("expected a loaded document");
    }
    serverDoc = connection.document;
    session = new DocWriter(serverDoc);
  });

  afterEach(async () => {
    await connection.disconnect();
    server.flushPendingStores();
  });

  // A plain Y.Doc fed the same update bytes Hocuspocus broadcasts to peers.
  function connectPeer(): Y.Doc {
    const peer = new Y.Doc();
    Y.applyUpdate(peer, Y.encodeStateAsUpdate(serverDoc));
    serverDoc.on("update", (update: Uint8Array) => {
      Y.applyUpdate(peer, update, "remote");
    });
    return peer;
  }

  test("a created tile broadcasts to every client, correctly placed", () => {
    const peerA = connectPeer();
    const peerB = connectPeer();

    const first = session.createTile(buildSectionMap({ layout: "GRID" }));
    const second = session.createTile(buildSectionMap({}), { beforeId: first });

    for (const peer of [peerA, peerB]) {
      const map = tiles(peer);
      expect(map.get(first)?.get("layout")).toBe("GRID");
      expect(map.get(second)?.get("parentId")).toBeNull();

      const firstOrder = map.get(first)?.get("order") as string;
      const secondOrder = map.get(second)?.get("order") as string;
      expect(secondOrder < firstOrder).toBe(true);
    }
  });

  test("streamed text reaches connected clients", () => {
    const peer = connectPeer();

    const tileId = session.createTile(buildTextMap({}));
    const writer = session.streamText(tileId, "append")!;
    writer.apply({ type: "paragraph" });
    writer.apply("Hello ");
    writer.apply({ bold: true });
    writer.apply("world");

    const content = tiles(peer).get(tileId)!.get("content") as Y.XmlFragment;
    const text = (content.get(0) as Y.XmlElement).get(0) as Y.XmlText;
    expect(text.toDelta()).toEqual([
      { insert: "Hello " },
      { insert: "world", attributes: { bold: {} } },
    ]);
  });

  test("setProperties and deleteTiles propagate to clients", () => {
    const peer = connectPeer();
    const a = session.createTile(buildSectionMap({ layout: "VERTICAL" }));
    const b = session.createTile(buildSectionMap({}));

    session.setProperties(a, { layout: "GRID" });
    session.deleteTiles([b]);

    const map = tiles(peer);
    expect(map.get(a)?.get("layout")).toBe("GRID");
    expect(map.has(b)).toBe(false);
  });

  test("writes are tagged AI_ORIGIN on the server document", () => {
    const origins: unknown[] = [];
    serverDoc.on("afterTransaction", (transaction) => {
      origins.push(transaction.origin);
    });

    const tileId = session.createTile(buildTextMap({}));
    session.streamText(tileId, "append")!.apply({ type: "paragraph" });

    expect(origins).toContain(AI_ORIGIN);
    expect(origins).not.toContain(null);
  });

  test("server-authored changes persist through the store pipeline", async () => {
    session.createTile(buildSectionMap({}));

    server.flushPendingStores();
    await vi.waitFor(() => {
      expect(prisma.page.update).toHaveBeenCalled();
    });

    const storeArgs = vi.mocked(prisma.page.update).mock.calls.at(-1)?.[0];
    const snapshot = (
      storeArgs as unknown as {
        data: { document: { update: { snapshot: Uint8Array } } };
      }
    ).data.document.update.snapshot;
    const restored = new Y.Doc();
    Y.applyUpdate(restored, snapshot);
    expect(tiles(restored).size).toBe(1);
  });

  test("a client's undo stack excludes server-authored changes", () => {
    const peer = connectPeer();

    const undoManager = new Y.UndoManager(peer.getMap("tiles"), {
      trackedOrigins: new Set(["editor-binding"]),
    });

    session.createTile(buildSectionMap({}));

    expect(tiles(peer).size).toBe(1);
    expect(undoManager.undoStack.length).toBe(0);
  });
});
