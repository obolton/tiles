import { describe, test, expect, vi, beforeEach } from "vitest";
import * as Y from "yjs";
import { base64ToBytes, equalBytes } from "doc/encoding";
import { TRPCError } from "@trpc/server";
import prisma from "@/database/prisma";
import { createEmptyDoc, CURRENT_SCHEMA_VERSION } from "@/collaboration/migrator";
import { LATEST_VERSION_FIELDS, VERSION_FIELDS } from "@/collaboration/versions";
import { VERSION_DOCUMENT_FIELDS, COPY_PAGE_FIELDS } from "../fields";
import {
  listVersions,
  getVersion,
  createNamedVersion,
  prepareRestore,
  renameVersion,
  deleteVersion,
  copyVersionToPage,
} from "../versions";
import type { Prisma } from "@/generated/prisma/client";
import type { CreateQuery, FindManyQuery, FindUniqueQuery } from "@/test/prisma";
import type { AuthenticatedRequestContext } from "@/utils/trpc";
import type {
  AuthenticatedPageProcedureContext,
  AuthenticatedWorkspaceProcedureContext,
} from "@/utils/middleware";

const PAGE_ID = "6e9c6c65-7bb1-4f5e-a3d7-64d1e2b3a111";
const VERSION_ID = "0f7d3e9a-1c2b-4d5e-8f90-a1b2c3d4e5f6";

const MOCK_AUTH_CONTEXT: AuthenticatedRequestContext = {
  res: {} as AuthenticatedRequestContext["res"],
  sessionId: "session-1",
  userId: "user-1",
  serviceName: null,
};

const CTX: AuthenticatedPageProcedureContext = {
  ...MOCK_AUTH_CONTEXT,
  pageId: PAGE_ID,
  workspaceId: "workspace-1",
};

const WORKSPACE_CTX: AuthenticatedWorkspaceProcedureContext = {
  ...MOCK_AUTH_CONTEXT,
  workspaceId: "workspace-1",
  role: "MEMBER",
};

let liveDoc: Y.Doc;

vi.mock("@/collaboration/documents", () => ({
  withDocument: (
    _pageId: string,
    _context: unknown,
    callback: (document: Y.Doc) => Promise<unknown>,
  ) => callback(liveDoc),
}));

function buildDoc(): Y.Doc {
  const doc = createEmptyDoc();
  doc.getMap("tiles").set("tile-1", new Y.Map());
  return doc;
}

type VersionRow = Prisma.Result<
  typeof prisma.pageVersion,
  { select: typeof VERSION_FIELDS },
  "findFirst"
>;

function versionRow(overrides: Partial<NonNullable<VersionRow>> = {}): NonNullable<VersionRow> {
  return {
    id: VERSION_ID,
    type: "AUTO",
    name: null,
    createdAt: new Date(),
    user: null,
    ...overrides,
  };
}

function mockSourcePageAccess(page: { id: string; workspaceId: string } | null) {
  vi.mocked(
    prisma.page.findUnique<FindUniqueQuery<{ id: true; workspaceId: true }>>,
  ).mockResolvedValue(page);
}

beforeEach(() => {
  vi.clearAllMocks();
  liveDoc = buildDoc();
});

describe("listVersions", () => {
  test("paginates results and never selects snapshot blobs", async () => {
    const rows = Array.from({ length: 16 }, (_, index) => versionRow({ id: `version-${index}` }));
    vi.mocked(prisma.pageVersion.findMany<FindManyQuery<typeof VERSION_FIELDS>>).mockResolvedValue(
      rows,
    );

    const result = await listVersions({ pageId: PAGE_ID });

    expect(result.versions).toHaveLength(15);
    expect(result.nextCursor).toBe("version-14");
    expect(prisma.pageVersion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { pageId: PAGE_ID },
        select: VERSION_FIELDS,
        orderBy: { createdAt: "desc" },
      }),
    );
    expect(VERSION_FIELDS).not.toHaveProperty("snapshot");
    expect(VERSION_FIELDS).not.toHaveProperty("stateVector");
  });

  test("passes the cursor through", async () => {
    vi.mocked(prisma.pageVersion.findMany<FindManyQuery<typeof VERSION_FIELDS>>).mockResolvedValue(
      [],
    );

    await listVersions({ pageId: PAGE_ID, cursor: VERSION_ID });

    expect(prisma.pageVersion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ cursor: { id: VERSION_ID }, skip: 1 }),
    );
  });
});

describe("getVersion", () => {
  test("returns the version fields with the stored state", async () => {
    const snapshot = new Uint8Array(Y.encodeStateAsUpdate(buildDoc()));
    vi.mocked(
      prisma.pageVersion.findFirst<FindUniqueQuery<typeof VERSION_DOCUMENT_FIELDS>>,
    ).mockResolvedValue({
      ...versionRow(),
      snapshot,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    });

    const result = await getVersion({ pageId: PAGE_ID, versionId: VERSION_ID });

    expect(result).toMatchObject({ id: VERSION_ID, type: "AUTO", user: null });
    expect(result).not.toHaveProperty("snapshot");
    expect(equalBytes(base64ToBytes(result.document), snapshot)).toBe(true);
    expect(prisma.pageVersion.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: VERSION_ID, pageId: PAGE_ID } }),
    );
  });

  test("migrates a stale-schema version on read", async () => {
    vi.mocked(
      prisma.pageVersion.findFirst<FindUniqueQuery<typeof VERSION_DOCUMENT_FIELDS>>,
    ).mockResolvedValue({
      ...versionRow(),
      snapshot: new Uint8Array(Y.encodeStateAsUpdate(new Y.Doc())),
      schemaVersion: 0,
    });

    const result = await getVersion({ pageId: PAGE_ID, versionId: VERSION_ID });

    const restored = new Y.Doc();
    Y.applyUpdate(restored, base64ToBytes(result.document));
    expect(restored.getMap("metadata").get("schemaVersion")).toBe(CURRENT_SCHEMA_VERSION);
  });

  test("throws NOT_FOUND for an unknown version", async () => {
    vi.mocked(prisma.pageVersion.findFirst).mockResolvedValue(null);

    await expect(getVersion({ pageId: PAGE_ID, versionId: VERSION_ID })).rejects.toThrow(TRPCError);
  });
});

describe("createNamedVersion", () => {
  test("creates a NAMED version of the live document", async () => {
    vi.mocked(prisma.pageVersion.create<CreateQuery<typeof VERSION_FIELDS>>).mockResolvedValue(
      versionRow({ type: "NAMED", name: "Launch" }),
    );

    const result = await createNamedVersion({ pageId: PAGE_ID, name: "Launch" }, CTX);

    expect(result.id).toBe(VERSION_ID);
    expect(prisma.pageVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          pageId: PAGE_ID,
          type: "NAMED",
          name: "Launch",
          userId: CTX.userId,
        }),
      }),
    );
  });
});

describe("prepareRestore", () => {
  test("returns the latest version when the state is unchanged", async () => {
    vi.mocked(
      prisma.pageVersion.findFirst<FindUniqueQuery<typeof LATEST_VERSION_FIELDS>>,
    ).mockResolvedValue({
      id: VERSION_ID,
      stateVector: new Uint8Array(Y.encodeStateVector(liveDoc)),
      createdAt: new Date(),
    });

    const result = await prepareRestore({ pageId: PAGE_ID }, CTX);

    expect(result).toEqual({ versionId: VERSION_ID });
    expect(prisma.pageVersion.create).not.toHaveBeenCalled();
  });

  test("creates a PRE_RESTORE version when the state has changed", async () => {
    vi.mocked(
      prisma.pageVersion.findFirst<FindUniqueQuery<typeof LATEST_VERSION_FIELDS>>,
    ).mockResolvedValue({
      id: VERSION_ID,
      stateVector: new Uint8Array(Y.encodeStateVector(new Y.Doc())),
      createdAt: new Date(),
    });
    vi.mocked(prisma.pageVersion.create<CreateQuery<typeof VERSION_FIELDS>>).mockResolvedValue(
      versionRow({ id: "new-version", type: "PRE_RESTORE" }),
    );

    const result = await prepareRestore({ pageId: PAGE_ID }, CTX);

    expect(result).toEqual({ versionId: "new-version" });
    expect(prisma.pageVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "PRE_RESTORE", userId: CTX.userId }),
      }),
    );
  });
});

describe("renameVersion", () => {
  test("updates only NAMED versions scoped to the page", async () => {
    await renameVersion({ pageId: PAGE_ID, versionId: VERSION_ID, name: "Renamed" });

    expect(prisma.pageVersion.update).toHaveBeenCalledWith({
      where: { id: VERSION_ID, pageId: PAGE_ID, type: "NAMED" },
      data: { name: "Renamed" },
    });
  });
});

describe("deleteVersion", () => {
  test("deletes only NAMED versions scoped to the page", async () => {
    await deleteVersion({ pageId: PAGE_ID, versionId: VERSION_ID });

    expect(prisma.pageVersion.delete).toHaveBeenCalledWith({
      where: { id: VERSION_ID, pageId: PAGE_ID, type: "NAMED" },
    });
  });
});

describe("copyVersionToPage", () => {
  test("creates a new page seeded with the version snapshot", async () => {
    mockSourcePageAccess({ id: PAGE_ID, workspaceId: "workspace-2" });
    const sourceSnapshot = new Uint8Array(Y.encodeStateAsUpdate(buildDoc()));
    vi.mocked(
      prisma.pageVersion.findFirst<FindUniqueQuery<typeof VERSION_DOCUMENT_FIELDS>>,
    ).mockResolvedValue({
      ...versionRow(),
      snapshot: sourceSnapshot,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    });
    vi.mocked(
      prisma.page.findUniqueOrThrow<FindUniqueQuery<typeof COPY_PAGE_FIELDS>>,
    ).mockResolvedValue({ title: "My page", type: "DOCUMENT" });
    vi.mocked(prisma.page.create<CreateQuery<{ id: true }>>).mockResolvedValue({
      id: "new-page",
    });

    const result = await copyVersionToPage(
      { pageId: PAGE_ID, versionId: VERSION_ID },
      WORKSPACE_CTX,
    );

    expect(result).toEqual({ id: "new-page" });
    const call = vi.mocked(prisma.page.create).mock.calls.at(0);
    if (!call) {
      throw new Error("expected page.create to be called");
    }
    expect(call[0].data).toMatchObject({
      title: "My page (copy)",
      type: "DOCUMENT",
      workspace: { connect: { id: WORKSPACE_CTX.workspaceId } },
      author: { connect: { id: WORKSPACE_CTX.userId } },
    });
    const snapshot = call[0].data.document?.create?.snapshot;
    expect(snapshot && equalBytes(new Uint8Array(snapshot), sourceSnapshot)).toBe(true);
  });

  test("throws UNAUTHORIZED when the caller lacks access to the source page", async () => {
    mockSourcePageAccess(null);

    await expect(
      copyVersionToPage({ pageId: PAGE_ID, versionId: VERSION_ID }, WORKSPACE_CTX),
    ).rejects.toThrow(TRPCError);
    expect(prisma.pageVersion.findFirst).not.toHaveBeenCalled();
    expect(prisma.page.create).not.toHaveBeenCalled();
  });

  test("throws NOT_FOUND for an unknown version", async () => {
    mockSourcePageAccess({ id: PAGE_ID, workspaceId: "workspace-2" });
    vi.mocked(prisma.pageVersion.findFirst).mockResolvedValue(null);

    await expect(
      copyVersionToPage({ pageId: PAGE_ID, versionId: VERSION_ID }, WORKSPACE_CTX),
    ).rejects.toThrow(TRPCError);
  });
});
