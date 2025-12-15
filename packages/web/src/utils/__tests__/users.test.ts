import { describe, expect, test, vi, beforeEach } from "vitest";
import {
  getCachedWorkspaceUsers,
  getWorkspaceUsers,
  invalidateWorkspaceUsers,
  getUserName,
} from "../users";
import { get, set, remove } from "../state";
import client from "@/api/client";

vi.mock("../state");
vi.mock("@/api/client", () => ({
  default: {
    workspaces: {
      listUsers: {
        query: vi.fn(),
      },
    },
  },
}));

const mockUsersResponse = {
  users: [
    {
      id: "user-1",
      name: "Alice Smith",
      email: "alice@example.com",
      imageUrl: null,
    },
    {
      id: "user-2",
      name: "Bob Jones",
      email: "bob@example.com",
      imageUrl: "https://example.com/bob.jpg",
    },
  ],
  nextCursor: null,
};

describe("getCachedWorkspaceUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns cached value when present", () => {
    vi.mocked(get).mockReturnValueOnce(mockUsersResponse);

    const result = getCachedWorkspaceUsers("workspace-123");

    expect(get).toHaveBeenCalledWith("users:workspace-123");
    expect(result).toEqual(mockUsersResponse);
  });

  test("returns null when cache is empty", () => {
    vi.mocked(get).mockReturnValueOnce(null);

    const result = getCachedWorkspaceUsers("workspace-123");

    expect(get).toHaveBeenCalledWith("users:workspace-123");
    expect(result).toBeNull();
  });
});

describe("getWorkspaceUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns cached value without fetching when cache exists", async () => {
    vi.mocked(get).mockReturnValueOnce(mockUsersResponse);

    const result = await getWorkspaceUsers("workspace-123");

    expect(get).toHaveBeenCalledWith("users:workspace-123");
    expect(client.workspaces.listUsers.query).not.toHaveBeenCalled();
    expect(result).toEqual(mockUsersResponse);
  });

  test("fetches and caches users when cache is empty", async () => {
    vi.mocked(get).mockReturnValueOnce(null);
    vi.mocked(client.workspaces.listUsers.query).mockResolvedValueOnce(
      mockUsersResponse,
    );

    const result = await getWorkspaceUsers("workspace-123");

    expect(get).toHaveBeenCalledWith("users:workspace-123");
    expect(client.workspaces.listUsers.query).toHaveBeenCalledWith({
      workspaceId: "workspace-123",
    });
    expect(set).toHaveBeenCalledWith("users:workspace-123", mockUsersResponse);
    expect(result).toEqual(mockUsersResponse);
  });
});

describe("invalidateWorkspaceUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("removes the cached user list", () => {
    invalidateWorkspaceUsers("workspace-123");

    expect(remove).toHaveBeenCalledWith("users:workspace-123");
  });
});

describe("getUserName", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns user name when user is in cache", () => {
    vi.mocked(get).mockReturnValueOnce(mockUsersResponse);

    const result = getUserName("workspace-123", "user-1");

    expect(get).toHaveBeenCalledWith("users:workspace-123");
    expect(result).toBe("Alice Smith");
  });

  test("returns null when user is not in cache", () => {
    vi.mocked(get).mockReturnValueOnce(mockUsersResponse);

    const result = getUserName("workspace-123", "user-999");

    expect(get).toHaveBeenCalledWith("users:workspace-123");
    expect(result).toBeNull();
  });

  test("returns null when cache is empty", () => {
    vi.mocked(get).mockReturnValueOnce(null);

    const result = getUserName("workspace-123", "user-1");

    expect(get).toHaveBeenCalledWith("users:workspace-123");
    expect(result).toBeNull();
  });
});
