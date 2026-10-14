import { describe, test, expect, vi, beforeEach } from "vitest";
import prisma from "@/database/prisma";
import { invalidateCachedPages } from "@/utils/cdn";
import { router } from "@/utils/trpc";
import {
  adminWorkspaceProcedure,
  authenticatedPageProcedure,
  authenticatedProcedure,
  authenticatedServiceProcedure,
  authenticatedWorkspaceProcedure,
  getPage,
  pageUpdateProcedure,
} from "@/utils/middleware";
import {
  createAuthenticatedContext,
  createServiceContext,
  createUnauthenticatedContext,
} from "@/test/mocks/context";
import type { FindUniqueQuery } from "@/test/prisma";
import type { TRPCRouterRecord } from "@trpc/server";
import type { RequestContext } from "@/utils/trpc";
import type { WorkspaceRole } from "@/generated/prisma/client";

vi.mock("@/utils/cdn", () => ({
  invalidateCachedPages: vi.fn(),
}));

const PAGE_ID = "11111111-1111-4111-8111-111111111111";
const WORKSPACE_ID = "22222222-2222-4222-8222-222222222222";

function mockPage(page: { id: string; workspaceId: string } | null) {
  vi.mocked(
    prisma.page.findUnique<FindUniqueQuery<{ id: true; workspaceId: true }>>,
  ).mockResolvedValue(page);
}

function mockMembership(role: WorkspaceRole | null) {
  vi.mocked(
    prisma.workspaceMembership.findUnique<FindUniqueQuery<{ workspaceId: true; role: true }>>,
  ).mockResolvedValue(role ? { workspaceId: WORKSPACE_ID, role } : null);
}

function createCaller<T extends TRPCRouterRecord>(procedures: T, ctx: RequestContext) {
  return router(procedures).createCaller(ctx);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("authenticatedProcedure", () => {
  const procedures = {
    probe: authenticatedProcedure.query(({ ctx }) => ({
      sessionId: ctx.sessionId,
      userId: ctx.userId,
    })),
  };

  test("should reject an unauthenticated caller", async () => {
    const caller = createCaller(procedures, createUnauthenticatedContext());
    await expect(caller.probe()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  test("should reject a service caller", async () => {
    const caller = createCaller(procedures, createServiceContext());
    await expect(caller.probe()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  test("should reject a session without a user", async () => {
    const ctx = { ...createUnauthenticatedContext(), sessionId: "session-1" };
    // @ts-expect-error: not a valid RequestContext, pins the defensive check
    const caller = createCaller(procedures, ctx);
    await expect(caller.probe()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  test("should pass an authenticated user through", async () => {
    const caller = createCaller(procedures, createAuthenticatedContext());
    await expect(caller.probe()).resolves.toEqual({ sessionId: "session-1", userId: "user-1" });
  });
});

describe("authenticatedServiceProcedure", () => {
  const procedures = {
    probe: authenticatedServiceProcedure.query(({ ctx }) => ctx.serviceName),
  };

  test("should reject an unauthenticated caller", async () => {
    const caller = createCaller(procedures, createUnauthenticatedContext());
    await expect(caller.probe()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  test("should reject an authenticated user", async () => {
    const caller = createCaller(procedures, createAuthenticatedContext());
    await expect(caller.probe()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  test("should pass a service caller through", async () => {
    const caller = createCaller(procedures, createServiceContext("web"));
    await expect(caller.probe()).resolves.toBe("web");
  });
});

describe("getPage", () => {
  test("should only find non-deleted pages the user authored or has access to", async () => {
    mockPage({ id: PAGE_ID, workspaceId: WORKSPACE_ID });

    await expect(getPage("user-1", PAGE_ID)).resolves.toEqual({
      id: PAGE_ID,
      workspaceId: WORKSPACE_ID,
    });

    expect(prisma.page.findUnique).toHaveBeenCalledWith({
      where: {
        id: PAGE_ID,
        deletedAt: null,
        OR: [{ authorId: "user-1" }, { access: { some: { userId: "user-1" } } }],
      },
      select: { id: true, workspaceId: true },
    });
  });
});

describe("authenticatedPageProcedure", () => {
  const procedures = {
    probe: authenticatedPageProcedure.query(({ ctx, input }) => ({
      pageId: ctx.pageId,
      workspaceId: ctx.workspaceId,
      input,
    })),
  };

  test("should reject an unauthenticated caller before looking up the page", async () => {
    const caller = createCaller(procedures, createUnauthenticatedContext());
    await expect(caller.probe({ pageId: PAGE_ID })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    expect(prisma.page.findUnique).not.toHaveBeenCalled();
  });

  test("should reject a non-UUID page id before looking up the page", async () => {
    const caller = createCaller(procedures, createAuthenticatedContext());
    await expect(caller.probe({ pageId: "not-a-uuid" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(prisma.page.findUnique).not.toHaveBeenCalled();
  });

  test("should reject a user without access to the page", async () => {
    mockPage(null);
    const caller = createCaller(procedures, createAuthenticatedContext());
    await expect(caller.probe({ pageId: PAGE_ID })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  test("should look up the page for the calling user", async () => {
    mockPage({ id: PAGE_ID, workspaceId: WORKSPACE_ID });
    const caller = createCaller(procedures, createAuthenticatedContext({ userId: "user-2" }));
    await caller.probe({ pageId: PAGE_ID });

    expect(prisma.page.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: PAGE_ID,
          deletedAt: null,
          OR: [{ authorId: "user-2" }, { access: { some: { userId: "user-2" } } }],
        }),
      }),
    );
  });

  test("should add the page and workspace ids to the context", async () => {
    mockPage({ id: PAGE_ID, workspaceId: WORKSPACE_ID });
    const caller = createCaller(procedures, createAuthenticatedContext());
    await expect(caller.probe({ pageId: PAGE_ID })).resolves.toEqual({
      pageId: PAGE_ID,
      workspaceId: WORKSPACE_ID,
      input: { pageId: PAGE_ID },
    });
  });
});

describe("pageUpdateProcedure", () => {
  test("should invalidate the cached page after the procedure resolves", async () => {
    mockPage({ id: PAGE_ID, workspaceId: WORKSPACE_ID });
    const resolver = vi.fn(() => {
      expect(invalidateCachedPages).not.toHaveBeenCalled();
      return "ok";
    });
    const caller = createCaller(
      { probe: pageUpdateProcedure.mutation(resolver) },
      createAuthenticatedContext(),
    );

    await expect(caller.probe({ pageId: PAGE_ID })).resolves.toBe("ok");

    expect(resolver).toHaveBeenCalledTimes(1);
    expect(invalidateCachedPages).toHaveBeenCalledExactlyOnceWith([PAGE_ID]);
  });

  test("should not invalidate the cached page when the procedure fails", async () => {
    mockPage({ id: PAGE_ID, workspaceId: WORKSPACE_ID });
    const caller = createCaller(
      {
        probe: pageUpdateProcedure.mutation(() => {
          throw new Error("Update failed");
        }),
      },
      createAuthenticatedContext(),
    );

    await expect(caller.probe({ pageId: PAGE_ID })).rejects.toThrow("Update failed");
    expect(invalidateCachedPages).not.toHaveBeenCalled();
  });

  test("should not invalidate the cached page when access is denied", async () => {
    mockPage(null);
    const caller = createCaller(
      { probe: pageUpdateProcedure.mutation(() => "ok") },
      createAuthenticatedContext(),
    );

    await expect(caller.probe({ pageId: PAGE_ID })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    expect(invalidateCachedPages).not.toHaveBeenCalled();
  });
});

describe("authenticatedWorkspaceProcedure", () => {
  const procedures = {
    probe: authenticatedWorkspaceProcedure.query(({ ctx, input }) => ({
      workspaceId: ctx.workspaceId,
      role: ctx.role,
      input,
    })),
  };

  test("should reject an unauthenticated caller before looking up the membership", async () => {
    const caller = createCaller(procedures, createUnauthenticatedContext());
    await expect(caller.probe({ workspaceId: WORKSPACE_ID })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    expect(prisma.workspaceMembership.findUnique).not.toHaveBeenCalled();
  });

  test("should reject a non-UUID workspace id before looking up the membership", async () => {
    const caller = createCaller(procedures, createAuthenticatedContext());
    await expect(caller.probe({ workspaceId: "not-a-uuid" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(prisma.workspaceMembership.findUnique).not.toHaveBeenCalled();
  });

  test("should reject a user who is not a member of the workspace", async () => {
    mockMembership(null);
    const caller = createCaller(procedures, createAuthenticatedContext());
    await expect(caller.probe({ workspaceId: WORKSPACE_ID })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  test("should look up the membership by user and workspace", async () => {
    mockMembership("MEMBER");
    const caller = createCaller(procedures, createAuthenticatedContext({ userId: "user-2" }));
    await caller.probe({ workspaceId: WORKSPACE_ID });

    expect(prisma.workspaceMembership.findUnique).toHaveBeenCalledWith({
      where: { id: { userId: "user-2", workspaceId: WORKSPACE_ID } },
      select: { workspaceId: true, role: true },
    });
  });

  test("should add the workspace id and role to the context", async () => {
    mockMembership("MEMBER");
    const caller = createCaller(procedures, createAuthenticatedContext());
    await expect(caller.probe({ workspaceId: WORKSPACE_ID })).resolves.toEqual({
      workspaceId: WORKSPACE_ID,
      role: "MEMBER",
      input: { workspaceId: WORKSPACE_ID },
    });
  });
});

describe("adminWorkspaceProcedure", () => {
  const procedures = {
    probe: adminWorkspaceProcedure.query(({ ctx }) => ctx.role),
  };

  test("should forbid a workspace member who is not an admin", async () => {
    mockMembership("MEMBER");
    const caller = createCaller(procedures, createAuthenticatedContext());
    await expect(caller.probe({ workspaceId: WORKSPACE_ID })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  test("should reject a user who is not a member of the workspace", async () => {
    mockMembership(null);
    const caller = createCaller(procedures, createAuthenticatedContext());
    await expect(caller.probe({ workspaceId: WORKSPACE_ID })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  test("should allow a workspace admin", async () => {
    mockMembership("ADMIN");
    const caller = createCaller(procedures, createAuthenticatedContext());
    await expect(caller.probe({ workspaceId: WORKSPACE_ID })).resolves.toBe("ADMIN");
  });
});
