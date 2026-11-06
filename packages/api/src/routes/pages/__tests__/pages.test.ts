import { describe, test, expect, vi, beforeEach } from "vitest";
import { getTiles } from "doc/test/tiles";
import prisma from "@/database/prisma";
import { invalidateCachedPages } from "@/utils/cdn";
import { RESULTS_PER_PAGE } from "@/utils/pagination";
import {
  getPageById,
  listPages,
  listSharedPages,
  listDeletedPages,
  createPage,
  createInitialDoc,
  updatePage,
  deletePages,
  restorePages,
  movePages,
  emptyTrash,
} from "../pages";
import { PAGE_FIELDS, LIBRARY_PAGE_FIELDS, type Page, type LibraryPage } from "../fields";
import { createAuthenticatedContext, createUnauthenticatedContext } from "@/test/mocks/context";
import type { CreateQuery, FindUniqueQuery, FindManyQuery, UpdateQuery } from "@/test/prisma";
import type {
  AuthenticatedPageProcedureContext,
  AuthenticatedWorkspaceProcedureContext,
} from "@/utils/middleware";

vi.mock("@/utils/cdn", () => ({ invalidateCachedPages: vi.fn() }));

const MOCK_CONTEXT: AuthenticatedWorkspaceProcedureContext = {
  res: {} as AuthenticatedWorkspaceProcedureContext["res"],
  sessionId: "session-1",
  userId: "user-1",
  isService: false,
  workspaceId: "workspace-1",
  role: "ADMIN",
};

const MOCK_PAGE_CONTEXT: AuthenticatedPageProcedureContext = {
  res: {} as AuthenticatedPageProcedureContext["res"],
  sessionId: "session-1",
  userId: "user-1",
  isService: false,
  pageId: "page-1",
  workspaceId: "workspace-1",
  pageType: "FREE",
};

const PAGE_ID = "6e9c6c65-7bb1-4f5e-a3d7-64d1e2b3a111";
const PAGE_IDS = ["page-1", "page-2"];

const PAGE: Page = {
  id: PAGE_ID,
  workspaceId: "workspace-1",
  folderId: null,
  published: true,
  title: "Shared page",
  type: "DOCUMENT",
  updatedAt: new Date(),
  author: { id: "author-1", username: "author", name: "Author", imageUrl: null },
  access: [{ user: { id: "collaborator-1", name: "Collaborator", imageUrl: null } }],
  invites: [{ id: "invite-1", email: "invitee@example.com", createdAt: new Date() }],
  document: { snapshot: Buffer.from([1, 2, 3]) },
};

function createMockPages(count: number): LibraryPage[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `page-${i + 1}`,
    title: `Page ${i + 1}`,
    type: "DOCUMENT",
    updatedAt: new Date(),
    published: false,
    folderId: null,
    author: { id: "user-1", name: "Alice", imageUrl: null },
    folder: null,
  }));
}

describe("getPageById", () => {
  const findUnique = vi.mocked(prisma.page.findUnique<FindUniqueQuery<typeof PAGE_FIELDS>>);

  beforeEach(() => {
    findUnique.mockResolvedValue(PAGE);
  });

  test("returns null when the page is not found", async () => {
    findUnique.mockResolvedValue(null);

    await expect(getPageById({ id: PAGE_ID }, createUnauthenticatedContext())).resolves.toBeNull();
  });

  test("only looks up published pages for anonymous callers", async () => {
    await getPageById({ id: PAGE_ID }, createUnauthenticatedContext());

    expect(findUnique).toHaveBeenCalledWith({
      where: { id: PAGE_ID, deletedAt: null, published: true },
      select: PAGE_FIELDS,
    });
  });

  test("omits collaborators and invites for anonymous callers", async () => {
    const page = await getPageById({ id: PAGE_ID }, createUnauthenticatedContext());

    expect(page).toMatchObject({ id: PAGE_ID, title: "Shared page", access: [], invites: [] });
    expect(JSON.stringify(page)).not.toContain("invitee@example.com");
  });

  test("omits collaborators and invites for signed-in users without access", async () => {
    const page = await getPageById(
      { id: PAGE_ID },
      createAuthenticatedContext({ userId: "other" }),
    );

    expect(page).toMatchObject({ access: [], invites: [] });
  });

  test("returns collaborators and invites to the author", async () => {
    const page = await getPageById(
      { id: PAGE_ID },
      createAuthenticatedContext({ userId: "author-1" }),
    );

    expect(page).toMatchObject({ access: PAGE.access, invites: PAGE.invites });
  });

  test("returns collaborators and invites to collaborators", async () => {
    const page = await getPageById(
      { id: PAGE_ID },
      createAuthenticatedContext({ userId: "collaborator-1" }),
    );

    expect(page).toMatchObject({ access: PAGE.access, invites: PAGE.invites });
  });

  test("encodes the document snapshot as base64", async () => {
    const page = await getPageById({ id: PAGE_ID }, createUnauthenticatedContext());

    expect(page?.document).toBe(Buffer.from([1, 2, 3]).toString("base64"));
  });
});

describe.each([
  ["listPages", listPages],
  ["listSharedPages", listSharedPages],
  ["listDeletedPages", listDeletedPages],
])("%s", (_name, list) => {
  const findMany = vi.mocked(prisma.page.findMany<FindManyQuery<typeof LIBRARY_PAGE_FIELDS>>);

  test("returns all pages with no cursor when there are no more results", async () => {
    const pages = createMockPages(RESULTS_PER_PAGE);
    findMany.mockResolvedValue(pages);

    await expect(list({}, MOCK_CONTEXT)).resolves.toEqual({ pages, nextCursor: null });
  });

  test("trims the extra result and returns the next cursor when there are more", async () => {
    const pages = createMockPages(RESULTS_PER_PAGE + 1);
    findMany.mockResolvedValue(pages);

    const result = await list({ cursor: "page-0", query: "page" }, MOCK_CONTEXT);

    expect(result.pages).toEqual(pages.slice(0, RESULTS_PER_PAGE));
    expect(result.nextCursor).toBe(`page-${RESULTS_PER_PAGE}`);
  });
});

describe("createPage", () => {
  beforeEach(() => {
    vi.mocked(prisma.page.create<CreateQuery<{ id: true }>>).mockResolvedValue({
      id: "page-1",
    });
  });

  test("defaults to DOCUMENT when type is omitted", async () => {
    await createPage({ title: "Untitled" }, MOCK_CONTEXT);

    expect(prisma.page.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "DOCUMENT" }),
      }),
    );
  });

  test("persists the requested type on the page", async () => {
    await createPage({ title: "Deck", type: "PRESENTATION" }, MOCK_CONTEXT);

    expect(prisma.page.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "PRESENTATION" }),
      }),
    );
  });
});

describe("createInitialDoc", () => {
  test("seeds no tiles for DOCUMENT pages, whose body starts empty", () => {
    expect(getTiles(createInitialDoc("DOCUMENT"))).toHaveLength(0);
  });

  test("seeds a FREEFORM, LANDSCAPE section for PRESENTATION pages", () => {
    const [tile, ...rest] = getTiles(createInitialDoc("PRESENTATION"));

    expect(rest).toHaveLength(0);
    expect(tile?.type).toBe("SECTION");
    expect(tile?.sizing).toBe("LANDSCAPE");
    expect(tile?.layout).toBe("FREEFORM");
  });

  test("seeds no tiles for COLLECTION pages", () => {
    expect(getTiles(createInitialDoc("COLLECTION"))).toHaveLength(0);
  });

  test("seeds no tiles for FREE pages", () => {
    expect(getTiles(createInitialDoc("FREE"))).toHaveLength(0);
  });
});

describe("updatePage", () => {
  const findFolder = vi.mocked(
    prisma.folder.findUniqueOrThrow<FindUniqueQuery<{ workspaceId: true }>>,
  );

  beforeEach(() => {
    findFolder.mockResolvedValue({ workspaceId: "workspace-1" });
    vi.mocked(prisma.page.update<UpdateQuery<typeof PAGE_FIELDS>>).mockResolvedValue(PAGE);
  });

  test("returns the updated page", async () => {
    await expect(
      updatePage({ pageId: PAGE_ID, title: "Renamed", published: true }, MOCK_PAGE_CONTEXT),
    ).resolves.toEqual(PAGE);
  });

  test("moves the page into a folder in the same workspace", async () => {
    await expect(
      updatePage({ pageId: PAGE_ID, folderId: "folder-1" }, MOCK_PAGE_CONTEXT),
    ).resolves.toEqual(PAGE);
  });

  test("clears the folder without validating one when folderId is null", async () => {
    findFolder.mockRejectedValue(new Error("Not found"));

    await expect(
      updatePage({ pageId: PAGE_ID, folderId: null }, MOCK_PAGE_CONTEXT),
    ).resolves.toEqual(PAGE);
  });

  test("rejects a folder from another workspace", async () => {
    findFolder.mockResolvedValue({ workspaceId: "workspace-2" });

    await expect(
      updatePage({ pageId: PAGE_ID, folderId: "folder-1" }, MOCK_PAGE_CONTEXT),
    ).rejects.toMatchObject({ code: "BAD_REQUEST", message: "Invalid folder" });
  });

  test("rejects a folder that does not exist", async () => {
    findFolder.mockRejectedValue(new Error("Not found"));

    await expect(
      updatePage({ pageId: PAGE_ID, folderId: "folder-1" }, MOCK_PAGE_CONTEXT),
    ).rejects.toThrow("Not found");
  });
});

describe("deletePages", () => {
  beforeEach(() => {
    vi.mocked(prisma.page.updateMany).mockResolvedValue({ count: 2 });
  });

  test("returns the number of deleted pages", async () => {
    await expect(deletePages({ pageIds: PAGE_IDS }, MOCK_CONTEXT)).resolves.toEqual({ count: 2 });
  });

  test("invalidates the cached pages", async () => {
    await deletePages({ pageIds: PAGE_IDS }, MOCK_CONTEXT);

    expect(invalidateCachedPages).toHaveBeenCalledWith(PAGE_IDS);
  });
});

describe("restorePages", () => {
  test("returns the number of restored pages", async () => {
    vi.mocked(prisma.page.updateMany).mockResolvedValue({ count: 2 });

    await expect(restorePages({ pageIds: PAGE_IDS }, MOCK_CONTEXT)).resolves.toEqual({
      count: 2,
    });
  });
});

describe("movePages", () => {
  const findFolder = vi.mocked(prisma.folder.findUnique<FindUniqueQuery<{ id: true }>>);

  beforeEach(() => {
    findFolder.mockResolvedValue({ id: "folder-1" });
    vi.mocked(prisma.page.updateMany).mockResolvedValue({ count: 2 });
  });

  test("returns the number of pages moved into the folder", async () => {
    await expect(
      movePages({ pageIds: PAGE_IDS, folderId: "folder-1" }, MOCK_CONTEXT),
    ).resolves.toEqual({ count: 2 });
  });

  test("moves pages out of their folder without validating one when folderId is null", async () => {
    findFolder.mockResolvedValue(null);

    await expect(movePages({ pageIds: PAGE_IDS, folderId: null }, MOCK_CONTEXT)).resolves.toEqual({
      count: 2,
    });
  });

  test("rejects a folder that is not in the workspace", async () => {
    findFolder.mockResolvedValue(null);

    await expect(
      movePages({ pageIds: PAGE_IDS, folderId: "folder-1" }, MOCK_CONTEXT),
    ).rejects.toMatchObject({ code: "BAD_REQUEST", message: "Invalid folder" });
  });
});

describe("emptyTrash", () => {
  test("returns the number of pages permanently deleted", async () => {
    vi.mocked(prisma.page.deleteMany).mockResolvedValue({ count: 3 });

    await expect(emptyTrash(MOCK_CONTEXT)).resolves.toEqual({ count: 3 });
  });
});
