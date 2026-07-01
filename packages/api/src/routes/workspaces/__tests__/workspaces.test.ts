import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "@/database/prisma.ts";
import {
  getWorkspace,
  createWorkspace,
  acceptWorkspaceInvite,
  leaveWorkspace,
  removeFromWorkspace,
  listWorkspaceUsers,
  updateWorkspaceRole,
} from "../workspaces.ts";
import { WORKSPACE_FIELDS, WORKSPACE_MEMBERSHIP_FIELDS } from "../fields";
import type {
  CreateQuery,
  FindUniqueQuery,
  FindManyQuery,
  UpdateQuery,
  DeleteQuery,
} from "@/test/prisma.ts";
import type { AuthenticatedRequestContext } from "@/utils/trpc.ts";
import type { AuthenticatedWorkspaceProcedureContext } from "@/utils/middleware.ts";

vi.mock("@/utils/keys.ts", () => ({
  createKey: async () => "mock-invite-key",
}));

vi.mock("@/utils/email.ts", () => ({
  sendEmail: vi.fn(async () => {}),
}));

vi.mock("@/utils/themes.ts", () => ({
  getDefaultThemesData: () => [],
}));

const MOCK_WORKSPACE = { id: "workspace-1", name: "Test Workspace" };

const MOCK_AUTH_CONTEXT: AuthenticatedRequestContext = {
  res: {} as AuthenticatedRequestContext["res"],
  sessionId: "session-1",
  userId: "user-1",
  serviceName: null,
};

const MOCK_WORKSPACE_CONTEXT: AuthenticatedWorkspaceProcedureContext = {
  ...MOCK_AUTH_CONTEXT,
  workspaceId: "workspace-1",
  role: "ADMIN",
};

describe("getWorkspace", () => {
  beforeEach(() => {
    vi.mocked(
      prisma.workspace.findUniqueOrThrow<FindUniqueQuery<typeof WORKSPACE_FIELDS>>,
    ).mockResolvedValue(MOCK_WORKSPACE);
  });

  it("should include the user's role in the response", async () => {
    const result = await getWorkspace({ workspaceId: "workspace-1" }, MOCK_WORKSPACE_CONTEXT);

    expect(result).toEqual({ ...MOCK_WORKSPACE, role: "ADMIN" });
  });

  it("should return MEMBER role when user is a member", async () => {
    const result = await getWorkspace(
      { workspaceId: "workspace-1" },
      { ...MOCK_WORKSPACE_CONTEXT, role: "MEMBER" },
    );

    expect(result.role).toBe("MEMBER");
  });
});

describe("createWorkspace", () => {
  beforeEach(() => {
    vi.mocked(prisma.workspace.create<CreateQuery<typeof WORKSPACE_FIELDS>>).mockResolvedValue(
      MOCK_WORKSPACE,
    );
  });

  it("should create the workspace creator as an ADMIN", async () => {
    await createWorkspace({ name: "Test" }, MOCK_AUTH_CONTEXT);

    expect(prisma.workspace.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          memberships: {
            create: {
              userId: "user-1",
              role: "ADMIN",
            },
          },
        }),
      }),
    );
  });
});

describe("acceptWorkspaceInvite", () => {
  beforeEach(() => {
    vi.mocked(
      prisma.workspaceInvite.findUniqueOrThrow<FindUniqueQuery<{ workspaceId: true }>>,
    ).mockResolvedValue({ workspaceId: "workspace-1" });

    vi.mocked(prisma.workspaceMembership.create<CreateQuery<{ userId: true }>>).mockResolvedValue({
      userId: "user-2",
    });

    vi.mocked(prisma.workspaceInvite.delete).mockResolvedValue(
      {} as Awaited<ReturnType<typeof prisma.workspaceInvite.delete>>,
    );
  });

  it("should create the invited user as a MEMBER", async () => {
    await acceptWorkspaceInvite(
      { key: "mock-invite-key" },
      { ...MOCK_AUTH_CONTEXT, userId: "user-2" },
    );

    expect(prisma.workspaceMembership.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          role: "MEMBER",
        }),
      }),
    );
  });
});

describe("listWorkspaceUsers", () => {
  const MOCK_MEMBERSHIPS = [
    {
      role: "ADMIN" as const,
      user: {
        id: "user-1",
        name: "Alice",
        email: "alice@test.com",
        imageUrl: null,
      },
    },
    {
      role: "MEMBER" as const,
      user: {
        id: "user-2",
        name: "Bob",
        email: "bob@test.com",
        imageUrl: null,
      },
    },
  ];

  beforeEach(() => {
    vi.mocked(
      prisma.workspaceMembership.findMany<FindManyQuery<typeof WORKSPACE_MEMBERSHIP_FIELDS>>,
    ).mockResolvedValue(MOCK_MEMBERSHIPS);
  });

  it("should include role in each user object", async () => {
    const result = await listWorkspaceUsers({}, MOCK_WORKSPACE_CONTEXT);

    expect(result.users).toEqual([
      {
        id: "user-1",
        name: "Alice",
        email: "alice@test.com",
        imageUrl: null,
        role: "ADMIN",
      },
      {
        id: "user-2",
        name: "Bob",
        email: "bob@test.com",
        imageUrl: null,
        role: "MEMBER",
      },
    ]);
  });

  it("should select membership fields including role", async () => {
    await listWorkspaceUsers({}, MOCK_WORKSPACE_CONTEXT);

    expect(prisma.workspaceMembership.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: WORKSPACE_MEMBERSHIP_FIELDS,
      }),
    );
  });
});

describe("leaveWorkspace", () => {
  it("should remove the current user when other admins exist", async () => {
    vi.mocked(prisma.workspaceMembership.count).mockResolvedValueOnce(1);
    vi.mocked(
      prisma.workspaceMembership.delete<DeleteQuery<{ workspaceId: true }>>,
    ).mockResolvedValueOnce({ workspaceId: "workspace-1" });

    await leaveWorkspace(MOCK_WORKSPACE_CONTEXT);

    expect(prisma.workspaceMembership.delete).toHaveBeenCalledWith({
      where: { id: { workspaceId: "workspace-1", userId: "user-1" } },
      select: { workspaceId: true },
    });
  });

  it("should reject leaving as the last admin", async () => {
    vi.mocked(prisma.workspaceMembership.count).mockResolvedValueOnce(0);

    await expect(leaveWorkspace(MOCK_WORKSPACE_CONTEXT)).rejects.toThrow(
      "Cannot leave as the last admin",
    );
  });
});

describe("removeFromWorkspace", () => {
  it("should remove a member when other admins exist", async () => {
    vi.mocked(prisma.workspaceMembership.count).mockResolvedValueOnce(1);
    vi.mocked(
      prisma.workspaceMembership.delete<DeleteQuery<{ workspaceId: true }>>,
    ).mockResolvedValueOnce({ workspaceId: "workspace-1" });

    await removeFromWorkspace({ userId: "user-2" }, MOCK_WORKSPACE_CONTEXT);

    expect(prisma.workspaceMembership.delete).toHaveBeenCalledWith({
      where: { id: { workspaceId: "workspace-1", userId: "user-2" } },
      select: { workspaceId: true },
    });
  });

  it("should reject removing the last admin", async () => {
    vi.mocked(prisma.workspaceMembership.count).mockResolvedValueOnce(0);

    await expect(removeFromWorkspace({ userId: "user-1" }, MOCK_WORKSPACE_CONTEXT)).rejects.toThrow(
      "Cannot remove the last admin",
    );
  });
});

describe("updateWorkspaceRole", () => {
  beforeEach(() => {
    vi.mocked(prisma.workspaceMembership.update<UpdateQuery<{ role: true }>>).mockResolvedValue({
      role: "ADMIN",
    });
  });

  it("should update a member's role", async () => {
    await updateWorkspaceRole({ userId: "user-2", role: "ADMIN" }, MOCK_WORKSPACE_CONTEXT);

    expect(prisma.workspaceMembership.update).toHaveBeenCalledWith({
      where: {
        id: { workspaceId: "workspace-1", userId: "user-2" },
      },
      data: { role: "ADMIN" },
      select: { role: true },
    });
  });

  it("should allow demoting when other admins exist", async () => {
    vi.mocked(prisma.workspaceMembership.count).mockResolvedValueOnce(1);

    await updateWorkspaceRole({ userId: "user-1", role: "MEMBER" }, MOCK_WORKSPACE_CONTEXT);

    expect(prisma.workspaceMembership.update).toHaveBeenCalledWith({
      where: {
        id: { workspaceId: "workspace-1", userId: "user-1" },
      },
      data: { role: "MEMBER" },
      select: { role: true },
    });
  });

  it("should reject demoting the last admin", async () => {
    vi.mocked(prisma.workspaceMembership.count).mockResolvedValueOnce(0);

    await expect(
      updateWorkspaceRole({ userId: "user-1", role: "MEMBER" }, MOCK_WORKSPACE_CONTEXT),
    ).rejects.toThrow("Cannot demote the last admin");
  });
});
