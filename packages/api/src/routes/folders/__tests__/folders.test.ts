import { describe, test, expect, vi, beforeEach } from "vitest";
import prisma from "@/database/prisma.ts";
import {
  createFolder,
  getFolder,
  updateFolder,
  deleteFolder,
  listFolders,
  listPages,
} from "../folders.ts";
import { FOLDER_FIELDS } from "../fields";
import { LIBRARY_PAGE_FIELDS, type LibraryPage } from "@/routes/pages/fields";
import { RESULTS_PER_PAGE } from "@/utils/pagination";
import type {
  CreateQuery,
  FindUniqueQuery,
  FindManyQuery,
  UpdateQuery,
  DeleteQuery,
} from "@/test/prisma.ts";
import type { AuthenticatedWorkspaceProcedureContext } from "@/utils/middleware.ts";

const MOCK_CONTEXT: AuthenticatedWorkspaceProcedureContext = {
  res: {} as AuthenticatedWorkspaceProcedureContext["res"],
  sessionId: "session-1",
  userId: "user-1",
  serviceName: null,
  workspaceId: "workspace-1",
  role: "ADMIN",
};

const MOCK_FOLDER = { id: "folder-1", name: "Projects" };

function createMockFolders(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `folder-${i + 1}`,
    name: `Folder ${i + 1}`,
  }));
}

function createMockPages(count: number): LibraryPage[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `page-${i + 1}`,
    title: `Page ${i + 1}`,
    type: "DOCUMENT",
    updatedAt: new Date(),
    published: false,
    folderId: "folder-1",
    author: { id: "user-1", name: "Alice", imageUrl: null },
    folder: MOCK_FOLDER,
  }));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createFolder", () => {
  beforeEach(() => {
    vi.mocked(prisma.folder.create<CreateQuery<typeof FOLDER_FIELDS>>).mockResolvedValue(
      MOCK_FOLDER,
    );
  });

  test("should create the folder in the current workspace for the current user", async () => {
    const result = await createFolder({ name: "Projects" }, MOCK_CONTEXT);

    expect(prisma.folder.create).toHaveBeenCalledWith({
      data: { workspaceId: "workspace-1", userId: "user-1", name: "Projects" },
      select: FOLDER_FIELDS,
    });
    expect(result).toEqual(MOCK_FOLDER);
  });
});

describe("getFolder", () => {
  beforeEach(() => {
    vi.mocked(
      prisma.folder.findUniqueOrThrow<FindUniqueQuery<typeof FOLDER_FIELDS>>,
    ).mockResolvedValue(MOCK_FOLDER);
  });

  test("should look up the folder scoped to the current workspace", async () => {
    const result = await getFolder({ id: "folder-1" }, MOCK_CONTEXT);

    expect(prisma.folder.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: "folder-1", workspaceId: "workspace-1" },
      select: FOLDER_FIELDS,
    });
    expect(result).toEqual(MOCK_FOLDER);
  });
});

describe("updateFolder", () => {
  beforeEach(() => {
    vi.mocked(prisma.folder.update<UpdateQuery<typeof FOLDER_FIELDS>>).mockResolvedValue({
      ...MOCK_FOLDER,
      name: "Archive",
    });
  });

  test("should update the folder name scoped to the current workspace", async () => {
    const result = await updateFolder({ id: "folder-1", name: "Archive" }, MOCK_CONTEXT);

    expect(prisma.folder.update).toHaveBeenCalledWith({
      where: { id: "folder-1", workspaceId: "workspace-1" },
      data: { name: "Archive" },
      select: FOLDER_FIELDS,
    });
    expect(result.name).toBe("Archive");
  });
});

describe("deleteFolder", () => {
  beforeEach(() => {
    vi.mocked(prisma.folder.delete<DeleteQuery<{ id: true }>>).mockResolvedValue({
      id: "folder-1",
    });
  });

  test("should delete the folder scoped to the current workspace", async () => {
    const result = await deleteFolder({ id: "folder-1" }, MOCK_CONTEXT);

    expect(prisma.folder.delete).toHaveBeenCalledWith({
      where: { id: "folder-1", workspaceId: "workspace-1" },
      select: { id: true },
    });
    expect(result).toEqual({ id: "folder-1" });
  });
});

describe("listFolders", () => {
  const findMany = vi.mocked(prisma.folder.findMany<FindManyQuery<typeof FOLDER_FIELDS>>);

  beforeEach(() => {
    findMany.mockResolvedValue([]);
  });

  test("should list folders in the workspace sorted by name", async () => {
    await listFolders({}, MOCK_CONTEXT);

    expect(findMany).toHaveBeenCalledWith({
      where: { workspaceId: "workspace-1" },
      select: FOLDER_FIELDS,
      orderBy: { name: "asc" },
      take: RESULTS_PER_PAGE + 1,
    });
  });

  test("should filter by name when a query is given", async () => {
    await listFolders({ query: "proj" }, MOCK_CONTEXT);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          workspaceId: "workspace-1",
          name: { contains: "proj", mode: "insensitive" },
        },
      }),
    );
  });

  test("should resume from the cursor when one is given", async () => {
    await listFolders({ cursor: "folder-5" }, MOCK_CONTEXT);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ cursor: { id: "folder-5" }, skip: 1 }),
    );
  });

  test("should return all folders with no cursor when there are no more results", async () => {
    const folders = createMockFolders(RESULTS_PER_PAGE);
    findMany.mockResolvedValue(folders);

    const result = await listFolders({}, MOCK_CONTEXT);

    expect(result).toEqual({ folders, nextCursor: null });
  });

  test("should trim the extra result and return the next cursor when there are more", async () => {
    const folders = createMockFolders(RESULTS_PER_PAGE + 1);
    findMany.mockResolvedValue(folders);

    const result = await listFolders({}, MOCK_CONTEXT);

    expect(result.folders).toEqual(folders.slice(0, RESULTS_PER_PAGE));
    expect(result.nextCursor).toBe(`folder-${RESULTS_PER_PAGE}`);
  });
});

describe("listPages", () => {
  const findUniqueOrThrow = vi.mocked(prisma.folder.findUniqueOrThrow);
  const findMany = vi.mocked(prisma.page.findMany<FindManyQuery<typeof LIBRARY_PAGE_FIELDS>>);

  beforeEach(() => {
    findUniqueOrThrow.mockResolvedValue(
      MOCK_FOLDER as Awaited<ReturnType<typeof prisma.folder.findUniqueOrThrow>>,
    );
    findMany.mockResolvedValue([]);
  });

  test("should throw without listing pages when the folder is not in the workspace", async () => {
    findUniqueOrThrow.mockRejectedValue(new Error("Not found"));

    await expect(listPages({ id: "folder-1" }, MOCK_CONTEXT)).rejects.toThrow("Not found");
    expect(findMany).not.toHaveBeenCalled();
  });

  test("should list pages in the folder sorted by updatedAt descending by default", async () => {
    await listPages({ id: "folder-1" }, MOCK_CONTEXT);

    expect(findMany).toHaveBeenCalledWith({
      where: { workspaceId: "workspace-1", folderId: "folder-1" },
      select: LIBRARY_PAGE_FIELDS,
      orderBy: { updatedAt: "desc" },
      take: RESULTS_PER_PAGE + 1,
    });
  });

  test("should sort by the requested field and direction", async () => {
    await listPages({ id: "folder-1", sortBy: "title", sortDirection: "asc" }, MOCK_CONTEXT);

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { title: "asc" } }));
  });

  test("should filter by title when a query is given", async () => {
    await listPages({ id: "folder-1", query: "plan" }, MOCK_CONTEXT);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          workspaceId: "workspace-1",
          folderId: "folder-1",
          title: { contains: "plan", mode: "insensitive" },
        },
      }),
    );
  });

  test("should resume from the cursor when one is given", async () => {
    await listPages({ id: "folder-1", cursor: "page-5" }, MOCK_CONTEXT);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ cursor: { id: "page-5" }, skip: 1 }),
    );
  });

  test("should return all pages with no cursor when there are no more results", async () => {
    const pages = createMockPages(RESULTS_PER_PAGE);
    findMany.mockResolvedValue(pages);

    const result = await listPages({ id: "folder-1" }, MOCK_CONTEXT);

    expect(result).toEqual({ pages, nextCursor: null });
  });

  test("should trim the extra result and return the next cursor when there are more", async () => {
    const pages = createMockPages(RESULTS_PER_PAGE + 1);
    findMany.mockResolvedValue(pages);

    const result = await listPages({ id: "folder-1" }, MOCK_CONTEXT);

    expect(result.pages).toEqual(pages.slice(0, RESULTS_PER_PAGE));
    expect(result.nextCursor).toBe(`page-${RESULTS_PER_PAGE}`);
  });
});
