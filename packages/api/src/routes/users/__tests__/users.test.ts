import { describe, test, expect, vi, beforeEach } from "vitest";
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
import type { AuthenticatedRequestContext } from "@/utils/trpc.ts";

vi.mock("@/utils/storage.ts", () => ({
  upload: vi.fn(async () => {}),
}));

vi.mock("@/utils/http.ts", () => ({
  getStream: vi.fn(),
}));

const MOCK_CONTEXT: AuthenticatedRequestContext = {
  res: {} as AuthenticatedRequestContext["res"],
  sessionId: "session-1",
  userId: "user-1",
  serviceName: null,
};

const MOCK_WORKSPACES = [
  { id: "workspace-1", name: "Workspace One" },
  { id: "workspace-2", name: "Workspace Two" },
];

const MOCK_USER = {
  id: "user-1",
  username: "alice",
  name: "Alice",
  email: "alice@test.com",
  imageKey: null,
  imageUrl: null,
  workspaceMemberships: MOCK_WORKSPACES.map((workspace) => ({ workspace })),
};

const MOCK_STREAM = new ReadableStream();
const UUID_PATTERN = "[0-9a-f-]{36}";

function createdUserData() {
  const call = vi.mocked(prisma.user.create).mock.calls.at(0);
  if (!call) {
    throw new Error("expected user.create to be called");
  }
  return call[0].data;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getStream).mockResolvedValue({ stream: MOCK_STREAM, contentType: "image/png" });
});

describe("storeProfileImage", () => {
  test("should upload the image to the profile bucket and return its key", async () => {
    const imageKey = await storeProfileImage("user-1", "https://example.com/avatar.png");

    expect(imageKey).toMatch(new RegExp(`^user-1/${UUID_PATTERN}\\.png$`));
    expect(upload).toHaveBeenCalledWith("test", imageKey, MOCK_STREAM, "image/png");
  });

  test("should only accept image content types", async () => {
    await storeProfileImage("user-1", "https://example.com/avatar.png");

    expect(getStream).toHaveBeenCalledWith("https://example.com/avatar.png", [
      "image/png",
      "image/jpeg",
      "image/webp",
    ]);
  });

  test("should use the file extension for the image's content type", async () => {
    vi.mocked(getStream).mockResolvedValueOnce({ stream: MOCK_STREAM, contentType: "image/jpeg" });

    const imageKey = await storeProfileImage("user-1", "https://example.com/avatar");

    expect(imageKey).toMatch(/\.jpg$/);
  });

  test("should not upload when the image cannot be fetched", async () => {
    vi.mocked(getStream).mockRejectedValueOnce(new Error("Not found"));

    await expect(storeProfileImage("user-1", "https://example.com/missing.png")).rejects.toThrow(
      "Not found",
    );
    expect(upload).not.toHaveBeenCalled();
  });
});

describe("createUser", () => {
  beforeEach(() => {
    vi.mocked(prisma.user.create<CreateQuery<{ id: true }>>).mockResolvedValue({ id: "user-1" });
  });

  test("should return the new user's id", async () => {
    const result = await createUser(prisma, {
      name: "Alice",
      email: "alice@test.com",
      emailVerified: true,
    });

    expect(result).toEqual({ id: "user-1" });
  });

  test("should create the user without an image when no image url is given", async () => {
    await createUser(prisma, { name: "Alice", email: "alice@test.com", emailVerified: true });

    expect(createdUserData()).toMatchObject({
      name: "Alice",
      email: "alice@test.com",
      emailVerified: true,
      imageKey: null,
    });
    expect(upload).not.toHaveBeenCalled();
  });

  test("should store the profile image under the new user's id", async () => {
    await createUser(prisma, {
      name: "Alice",
      email: "alice@test.com",
      emailVerified: false,
      imageUrl: "https://example.com/avatar.png",
    });

    const { id, imageKey } = createdUserData();
    expect(imageKey).toMatch(new RegExp(`^${id}/${UUID_PATTERN}\\.png$`));
    expect(upload).toHaveBeenCalledWith("test", imageKey, MOCK_STREAM, "image/png");
  });

  test("should not create the user when the profile image cannot be stored", async () => {
    vi.mocked(getStream).mockRejectedValueOnce(new Error("Not found"));

    await expect(
      createUser(prisma, {
        name: "Alice",
        email: "alice@test.com",
        emailVerified: false,
        imageUrl: "https://example.com/missing.png",
      }),
    ).rejects.toThrow("Not found");

    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});

describe("getSessionContext", () => {
  test("should return the user id of a live session", async () => {
    vi.mocked(prisma.session.findUnique<FindUniqueQuery<{ userId: true }>>).mockResolvedValue({
      userId: "user-1",
    });

    const result = await getSessionContext("session-1");

    expect(result).toEqual({ userId: "user-1" });
  });

  test("should only look up sessions that have not expired", async () => {
    vi.mocked(prisma.session.findUnique).mockResolvedValue(null);

    await getSessionContext("session-1");

    expect(prisma.session.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "session-1", expiresAt: { gt: expect.any(Date) } },
      }),
    );
  });

  test("should return null when there is no live session", async () => {
    vi.mocked(prisma.session.findUnique).mockResolvedValue(null);

    const result = await getSessionContext("session-1");

    expect(result).toBeNull();
  });
});

describe("getUserInfo", () => {
  beforeEach(() => {
    vi.mocked(prisma.user.findUniqueOrThrow<FindUniqueQuery<typeof USER_FIELDS>>).mockResolvedValue(
      MOCK_USER,
    );
  });

  test("should return the current user's profile with their workspaces", async () => {
    const result = await getUserInfo(MOCK_CONTEXT);

    expect(result).toEqual({
      id: "user-1",
      username: "alice",
      name: "Alice",
      email: "alice@test.com",
      imageKey: null,
      imageUrl: null,
      workspaces: MOCK_WORKSPACES,
    });
  });
});

describe("updateUser", () => {
  beforeEach(() => {
    vi.mocked(prisma.user.update<UpdateQuery<typeof USER_FIELDS>>).mockResolvedValue({
      ...MOCK_USER,
      name: "Alice Smith",
    });
  });

  test("should update the current user", async () => {
    await updateUser({ name: "Alice Smith" }, MOCK_CONTEXT);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: expect.objectContaining({ name: "Alice Smith" }),
      }),
    );
  });

  test("should return the updated profile with the user's workspaces", async () => {
    const result = await updateUser({ name: "Alice Smith" }, MOCK_CONTEXT);

    expect(result).toEqual({
      id: "user-1",
      username: "alice",
      name: "Alice Smith",
      email: "alice@test.com",
      imageKey: null,
      imageUrl: null,
      workspaces: MOCK_WORKSPACES,
    });
  });
});

describe("isUsernameAvailable", () => {
  test("should be available when no user has the username", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const result = await isUsernameAvailable({ username: "alice" }, MOCK_CONTEXT);

    expect(result).toBe(true);
  });

  test("should be available when the current user already owns the username", async () => {
    vi.mocked(prisma.user.findUnique<FindUniqueQuery<{ id: true }>>).mockResolvedValue({
      id: "user-1",
    });

    const result = await isUsernameAvailable({ username: "alice" }, MOCK_CONTEXT);

    expect(result).toBe(true);
  });

  test("should be unavailable when another user owns the username", async () => {
    vi.mocked(prisma.user.findUnique<FindUniqueQuery<{ id: true }>>).mockResolvedValue({
      id: "user-2",
    });

    const result = await isUsernameAvailable({ username: "alice" }, MOCK_CONTEXT);

    expect(result).toBe(false);
  });
});
