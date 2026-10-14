import { describe, test, expect, vi, beforeEach } from "vitest";
import { getTiles } from "doc/test/tiles";
import prisma from "@/database/prisma";
import { createPage, createInitialDoc, getPageById } from "../pages";
import { PAGE_FIELDS, type Page } from "../fields";
import { createAuthenticatedContext, createUnauthenticatedContext } from "@/test/mocks/context";
import type { CreateQuery, FindUniqueQuery } from "@/test/prisma";
import type { AuthenticatedWorkspaceProcedureContext } from "@/utils/middleware";

const MOCK_CONTEXT: AuthenticatedWorkspaceProcedureContext = {
  res: {} as AuthenticatedWorkspaceProcedureContext["res"],
  sessionId: "session-1",
  userId: "user-1",
  serviceName: null,
  workspaceId: "workspace-1",
  role: "ADMIN",
};

const PAGE_ID = "6e9c6c65-7bb1-4f5e-a3d7-64d1e2b3a111";

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

describe("getPageById", () => {
  const findUnique = vi.mocked(prisma.page.findUnique<FindUniqueQuery<typeof PAGE_FIELDS>>);

  beforeEach(() => {
    vi.clearAllMocks();
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

describe("createPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
  test("seeds a single TEXT tile for DOCUMENT pages", () => {
    const [tile, ...rest] = getTiles(createInitialDoc("DOCUMENT"));

    expect(rest).toHaveLength(0);
    expect(tile?.type).toBe("TEXT");
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
