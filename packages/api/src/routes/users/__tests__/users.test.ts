import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import prisma from "@/database/prisma.ts";
import { upload } from "@/utils/storage.ts";
import { getStream } from "@/utils/http.ts";
import {
  storeProfileImage,
  createUser,
  getSessionContext,
  getUserInfo,
  updateUser,
  isUsernameAvailable,
} from "../users.ts";
import { USER_FIELDS } from "../fields";
import type { CreateQuery, FindUniqueQuery, UpdateQuery } from "@/test/prisma.ts";
import { createAuthenticatedContext } from "@/test/mocks/context.ts";

vi.mock("@/utils/storage.ts", () => ({
  upload: vi.fn(async () => {}),
}));

vi.mock("@/utils/http.ts", () => ({
  getStream: vi.fn(),
}));

const MOCK_CONTEXT = createAuthenticatedContext({ userId: "user-1" });

const MOCK_USER = {
  id: "user-1",
  username: "alice",
  name: "Alice",
  email: "alice@test.com",
  imageKey: null,
  imageUrl: null,
  workspaceMemberships: [
    { workspace: { id: "workspace-1", name: "Workspace One" } },
    { workspace: { id: "workspace-2", name: "Workspace Two" } },
  ],
};

const MOCK_STREAM = new ReadableStream();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getStream).mockResolvedValue({ stream: MOCK_STREAM, contentType: "image/png" });
});

const UUID_PATTERN = "[0-9a-f-]{36}";

describe("storeProfileImage", () => {
  test("should fetch the image accepting image content types only", async () => {
    await storeProfileImage("user-1", "https://example.com/avatar.png");

    expect(getStream).toHaveBeenCalledWith("https://example.com/avatar.png", [
      "image/png",
      "image/jpeg",
      "image/webp",
    ]);
  });

  test("should upload the stream to the profile images bucket under the user's key", async () => {
    const imageKey = await storeProfileImage("user-1", "https://example.com/avatar.png");

    expect(imageKey).toMatch(new RegExp(`^user-1/${UUID_PATTERN}\\.png$`));
    expect(upload).toHaveBeenCalledWith("test", imageKey, MOCK_STREAM, "image/png");
  });

  test("should derive the file extension from the content type", async () => {
    vi.mocked(getStream).mockResolvedValueOnce({ stream: MOCK_STREAM, contentType: "image/jpeg" });

    const imageKey = await storeProfileImage("user-1", "https://example.com/avatar");

    expect(imageKey).toMatch(new RegExp(`^user-1/${UUID_PATTERN}\\.jpg$`));
  });

  test("should not upload when the image cannot be fetched", async () => {
    vi.mocked(getStream).mockRejectedValueOnce(new Error("getStream: 404: Not Found"));

    await expect(storeProfileImage("user-1", "https://example.com/missing.png")).rejects.toThrow(
      "getStream: 404: Not Found",
    );
    expect(upload).not.toHaveBeenCalled();
  });
});

describe("createUser", () => {
  beforeEach(() => {
    vi.mocked(prisma.user.create<CreateQuery<{ id: true }>>).mockResolvedValue({ id: "user-1" });
  });

  test("should create the user with a null image key when no image url is given", async () => {
    const result = await createUser(prisma, {
      name: "Alice",
      email: "alice@test.com",
      emailVerified: true,
    });

    expect(result).toEqual({ id: "user-1" });
    expect(getStream).not.toHaveBeenCalled();
    expect(upload).not.toHaveBeenCalled();
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        id: expect.any(String),
        name: "Alice",
        email: "alice@test.com",
        emailVerified: true,
        imageKey: null,
      },
      select: { id: true },
    });
  });

  test("should store the profile image under the new user's id", async () => {
    await createUser(prisma, {
      name: "Alice",
      email: "alice@test.com",
      emailVerified: false,
      imageUrl: "https://example.com/avatar.png",
    });

    const { id, imageKey } = vi.mocked(prisma.user.create).mock.calls[0]?.[0].data ?? {};
    expect(imageKey).toMatch(new RegExp(`^${id}/${UUID_PATTERN}\\.png$`));
    expect(upload).toHaveBeenCalledWith("test", imageKey, MOCK_STREAM, "image/png");
  });

  test("should use the supplied transaction client", async () => {
    const transaction = { user: { create: vi.fn(async () => ({ id: "user-2" })) } };

    const result = await createUser(transaction as unknown as typeof prisma, {
      name: "Bob",
      email: "bob@test.com",
      emailVerified: true,
    });

    expect(result).toEqual({ id: "user-2" });
    expect(transaction.user.create).toHaveBeenCalledTimes(1);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});

describe("getSessionContext", () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date("2026-06-01T12:00:00Z") });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("should only match sessions that have not expired", async () => {
    vi.mocked(prisma.session.findUnique<FindUniqueQuery<{ userId: true }>>).mockResolvedValue({
      userId: "user-1",
    });

    await getSessionContext("session-1");

    expect(prisma.session.findUnique).toHaveBeenCalledWith({
      where: { id: "session-1", expiresAt: { gt: new Date("2026-06-01T12:00:00Z") } },
      select: { userId: true },
    });
  });

  test("should return the session's user id", async () => {
    vi.mocked(prisma.session.findUnique<FindUniqueQuery<{ userId: true }>>).mockResolvedValue({
      userId: "user-1",
    });

    await expect(getSessionContext("session-1")).resolves.toEqual({ userId: "user-1" });
  });

  test("should return null for a missing or expired session", async () => {
    vi.mocked(prisma.session.findUnique).mockResolvedValue(null);

    await expect(getSessionContext("session-1")).resolves.toBeNull();
  });
});

describe("getUserInfo", () => {
  beforeEach(() => {
    vi.mocked(prisma.user.findUniqueOrThrow<FindUniqueQuery<typeof USER_FIELDS>>).mockResolvedValue(
      MOCK_USER,
    );
  });

  test("should look up the current user", async () => {
    await getUserInfo(MOCK_CONTEXT);

    expect(prisma.user.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: USER_FIELDS,
    });
  });

  test("should flatten workspace memberships into workspaces", async () => {
    const result = await getUserInfo(MOCK_CONTEXT);

    expect(result).toEqual({
      id: "user-1",
      username: "alice",
      name: "Alice",
      email: "alice@test.com",
      imageKey: null,
      imageUrl: null,
      workspaces: [
        { id: "workspace-1", name: "Workspace One" },
        { id: "workspace-2", name: "Workspace Two" },
      ],
    });
    expect(result).not.toHaveProperty("workspaceMemberships");
  });
});

describe("updateUser", () => {
  beforeEach(() => {
    vi.mocked(prisma.user.update<UpdateQuery<typeof USER_FIELDS>>).mockResolvedValue({
      ...MOCK_USER,
      name: "Alice Smith",
    });
  });

  test("should update the current user with the given fields", async () => {
    await updateUser({ name: "Alice Smith", username: null }, MOCK_CONTEXT);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        username: null,
        name: "Alice Smith",
        email: undefined,
        imageKey: undefined,
      },
      select: USER_FIELDS,
    });
  });

  test("should flatten workspace memberships into workspaces", async () => {
    const result = await updateUser({ name: "Alice Smith" }, MOCK_CONTEXT);

    expect(result.name).toBe("Alice Smith");
    expect(result.workspaces).toEqual([
      { id: "workspace-1", name: "Workspace One" },
      { id: "workspace-2", name: "Workspace Two" },
    ]);
    expect(result).not.toHaveProperty("workspaceMemberships");
  });
});

describe("isUsernameAvailable", () => {
  test("should look up the username", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await isUsernameAvailable({ username: "alice" }, MOCK_CONTEXT);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { username: "alice" },
      select: { id: true },
    });
  });

  test("should be available when no user has the username", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(isUsernameAvailable({ username: "alice" }, MOCK_CONTEXT)).resolves.toBe(true);
  });

  test("should be available when the caller already owns the username", async () => {
    vi.mocked(prisma.user.findUnique<FindUniqueQuery<{ id: true }>>).mockResolvedValue({
      id: "user-1",
    });

    await expect(isUsernameAvailable({ username: "alice" }, MOCK_CONTEXT)).resolves.toBe(true);
  });

  test("should be unavailable when another user owns the username", async () => {
    vi.mocked(prisma.user.findUnique<FindUniqueQuery<{ id: true }>>).mockResolvedValue({
      id: "user-2",
    });

    await expect(isUsernameAvailable({ username: "alice" }, MOCK_CONTEXT)).resolves.toBe(false);
  });
});
