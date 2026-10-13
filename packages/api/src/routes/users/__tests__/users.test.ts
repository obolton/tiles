import { describe, test, expect, vi, beforeEach } from "vitest";
import prisma, { type PrismaTransactionClient } from "@/database/prisma.ts";
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
import { mockQuery } from "@/test/prisma.ts";
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

const MOCK_WORKSPACES = [
  { id: "workspace-1", name: "Workspace One" },
  { id: "workspace-2", name: "Workspace Two" },
];

const MOCK_STREAM = new ReadableStream();
const UUID_PATTERN = "[0-9a-f-]{36}";

function createDb() {
  const create = vi.fn(async ({ data }: { data: { id: string; imageKey: string | null } }) => ({
    id: data.id,
  }));
  return { db: { user: { create } } as unknown as PrismaTransactionClient, create };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getStream).mockResolvedValue({ stream: MOCK_STREAM, contentType: "image/png" });
});

describe("storeProfileImage", () => {
  test("should upload the fetched image to the profile bucket and return its key", async () => {
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

  test("should give the key an extension matching the image's content type", async () => {
    vi.mocked(getStream).mockResolvedValueOnce({ stream: MOCK_STREAM, contentType: "image/jpeg" });

    const imageKey = await storeProfileImage("user-1", "https://example.com/avatar");

    expect(imageKey).toMatch(/\.jpg$/);
  });

  test("should use a different key for each stored image", async () => {
    const first = await storeProfileImage("user-1", "https://example.com/avatar.png");
    const second = await storeProfileImage("user-1", "https://example.com/avatar.png");

    expect(first).not.toBe(second);
  });

  test("should fail without uploading when the image cannot be fetched", async () => {
    vi.mocked(getStream).mockRejectedValueOnce(new Error("getStream: 404: Not Found"));

    await expect(storeProfileImage("user-1", "https://example.com/missing.png")).rejects.toThrow(
      "getStream: 404: Not Found",
    );
    expect(upload).not.toHaveBeenCalled();
  });
});

describe("createUser", () => {
  test("should return the new user's id", async () => {
    const { db } = createDb();

    const result = await createUser(db, {
      name: "Alice",
      email: "alice@test.com",
      emailVerified: true,
    });

    expect(result.id).toMatch(new RegExp(`^${UUID_PATTERN}$`));
  });

  test("should create the user without an image when no image url is given", async () => {
    const { db, create } = createDb();

    await createUser(db, { name: "Alice", email: "alice@test.com", emailVerified: true });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Alice",
          email: "alice@test.com",
          emailVerified: true,
          imageKey: null,
        }),
      }),
    );
    expect(upload).not.toHaveBeenCalled();
  });

  test("should store the profile image under the new user's id", async () => {
    const { db, create } = createDb();

    const { id } = await createUser(db, {
      name: "Alice",
      email: "alice@test.com",
      emailVerified: false,
      imageUrl: "https://example.com/avatar.png",
    });

    const imageKey = create.mock.calls[0]?.[0].data.imageKey;
    expect(imageKey).toMatch(new RegExp(`^${id}/${UUID_PATTERN}\\.png$`));
    expect(upload).toHaveBeenCalledWith("test", imageKey, MOCK_STREAM, "image/png");
  });

  test("should not create the user when the profile image cannot be stored", async () => {
    const { db, create } = createDb();
    vi.mocked(getStream).mockRejectedValueOnce(new Error("getStream: 404: Not Found"));

    await expect(
      createUser(db, {
        name: "Alice",
        email: "alice@test.com",
        emailVerified: false,
        imageUrl: "https://example.com/missing.png",
      }),
    ).rejects.toThrow("getStream: 404: Not Found");

    expect(create).not.toHaveBeenCalled();
  });
});

describe("getSessionContext", () => {
  const SESSIONS = new Map([
    ["session-live", { userId: "user-1", expiresAt: new Date(Date.now() + 60_000) }],
    ["session-expired", { userId: "user-2", expiresAt: new Date(Date.now() - 60_000) }],
  ]);

  beforeEach(() => {
    mockQuery(prisma.session.findUnique, async ({ where }) => {
      const session = where.id ? SESSIONS.get(where.id) : undefined;
      const { expiresAt } = where;
      const cutoff =
        expiresAt &&
        typeof expiresAt === "object" &&
        "gt" in expiresAt &&
        expiresAt.gt instanceof Date
          ? expiresAt.gt
          : new Date(0);
      return session && session.expiresAt > cutoff ? { userId: session.userId } : null;
    });
  });

  test("should return the user id for a live session", async () => {
    await expect(getSessionContext("session-live")).resolves.toEqual({ userId: "user-1" });
  });

  test("should return null for an expired session", async () => {
    await expect(getSessionContext("session-expired")).resolves.toBeNull();
  });

  test("should return null for an unknown session", async () => {
    await expect(getSessionContext("session-unknown")).resolves.toBeNull();
  });
});

describe("getUserInfo", () => {
  beforeEach(() => {
    mockQuery(prisma.user.findUniqueOrThrow, async ({ where }) => {
      if (where.id !== "user-1") {
        throw new Error("No User found");
      }
      return MOCK_USER;
    });
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

  test("should fail for a user that no longer exists", async () => {
    await expect(getUserInfo({ ...MOCK_CONTEXT, userId: "user-gone" })).rejects.toThrow(
      "No User found",
    );
  });
});

describe("updateUser", () => {
  beforeEach(() => {
    mockQuery(prisma.user.update, async ({ where, data }) => {
      if (where.id !== "user-1") {
        throw new Error("No User found");
      }
      return {
        ...MOCK_USER,
        ...Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)),
      };
    });
  });

  test("should return the updated profile with the user's workspaces", async () => {
    const result = await updateUser({ name: "Alice Smith", username: null }, MOCK_CONTEXT);

    expect(result).toEqual({
      id: "user-1",
      username: null,
      name: "Alice Smith",
      email: "alice@test.com",
      imageKey: null,
      imageUrl: null,
      workspaces: MOCK_WORKSPACES,
    });
  });

  test("should leave fields that are not supplied unchanged", async () => {
    const result = await updateUser({ imageKey: "user-1/avatar.png" }, MOCK_CONTEXT);

    expect(result).toMatchObject({
      username: "alice",
      name: "Alice",
      email: "alice@test.com",
      imageKey: "user-1/avatar.png",
    });
  });

  test("should fail for a user that no longer exists", async () => {
    await expect(
      updateUser({ name: "Alice Smith" }, { ...MOCK_CONTEXT, userId: "user-gone" }),
    ).rejects.toThrow("No User found");
  });
});

describe("isUsernameAvailable", () => {
  beforeEach(() => {
    mockQuery(prisma.user.findUnique, async ({ where }) => {
      switch (where.username) {
        case "alice":
          return { id: "user-1" };
        case "bob":
          return { id: "user-2" };
        default:
          return null;
      }
    });
  });

  test("should be available when no user has the username", async () => {
    await expect(isUsernameAvailable({ username: "carol" }, MOCK_CONTEXT)).resolves.toBe(true);
  });

  test("should be available when the caller already owns the username", async () => {
    await expect(isUsernameAvailable({ username: "alice" }, MOCK_CONTEXT)).resolves.toBe(true);
  });

  test("should be unavailable when another user owns the username", async () => {
    await expect(isUsernameAvailable({ username: "bob" }, MOCK_CONTEXT)).resolves.toBe(false);
  });
});
