import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import {
  getCachedWorkspaceUsers,
  getWorkspaceUsers,
  invalidateWorkspaceUsers,
  getUserName,
  clearUsersMap,
} from "../users";
import { initializeCache, destroyCache } from "../cache";
import client from "@/api/client";

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

describe("users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearUsersMap();
    initializeCache("user-123", "workspace-123");
  });

  afterEach(async () => {
    await destroyCache();
  });

  describe("getCachedWorkspaceUsers", () => {
    test("returns null when cache is empty", async () => {
      const result = await getCachedWorkspaceUsers();
      expect(result).toBeNull();
    });

    test("returns cached value when present and fresh", async () => {
      // Populate cache via getWorkspaceUsers
      vi.mocked(client.workspaces.listUsers.query).mockResolvedValueOnce(
        mockUsersResponse,
      );
      await getWorkspaceUsers();

      const result = await getCachedWorkspaceUsers();

      expect(result).toEqual(mockUsersResponse);
    });
  });

  describe("getWorkspaceUsers", () => {
    test("returns cached value without fetching when cache exists", async () => {
      vi.mocked(client.workspaces.listUsers.query).mockResolvedValueOnce(
        mockUsersResponse,
      );
      await getWorkspaceUsers();

      vi.clearAllMocks();

      const result = await getWorkspaceUsers();

      expect(client.workspaces.listUsers.query).not.toHaveBeenCalled();
      expect(result).toEqual(mockUsersResponse);
    });

    test("fetches and caches users when cache is empty", async () => {
      vi.mocked(client.workspaces.listUsers.query).mockResolvedValueOnce(
        mockUsersResponse,
      );

      const result = await getWorkspaceUsers();

      expect(client.workspaces.listUsers.query).toHaveBeenCalledWith({
        workspaceId: "workspace-123",
      });
      expect(result).toEqual(mockUsersResponse);

      const cached = await getCachedWorkspaceUsers();
      expect(cached).toEqual(mockUsersResponse);
    });
  });

  describe("invalidateWorkspaceUsers", () => {
    test("removes the cached user list", async () => {
      vi.mocked(client.workspaces.listUsers.query).mockResolvedValueOnce(
        mockUsersResponse,
      );
      await getWorkspaceUsers();

      // Verify cache exists
      const beforeInvalidate = await getCachedWorkspaceUsers();
      expect(beforeInvalidate).not.toBeNull();

      // Invalidate
      await invalidateWorkspaceUsers();

      // Verify cache is cleared
      const afterInvalidate = await getCachedWorkspaceUsers();
      expect(afterInvalidate).toBeNull();
    });

    test("clears the in-memory user map", async () => {
      // Populate cache (which also populates the memory map)
      vi.mocked(client.workspaces.listUsers.query).mockResolvedValueOnce(
        mockUsersResponse,
      );
      await getWorkspaceUsers();

      expect(getUserName("user-1")).toBe("Alice Smith");

      await invalidateWorkspaceUsers();

      expect(getUserName("user-1")).toBeNull();
    });
  });

  describe("getUserName", () => {
    test("returns user name when user is in memory map", async () => {
      vi.mocked(client.workspaces.listUsers.query).mockResolvedValueOnce(
        mockUsersResponse,
      );
      await getWorkspaceUsers();

      const result = getUserName("user-1");

      expect(result).toBe("Alice Smith");
    });

    test("returns null when user is not in memory map", async () => {
      vi.mocked(client.workspaces.listUsers.query).mockResolvedValueOnce(
        mockUsersResponse,
      );
      await getWorkspaceUsers();

      const result = getUserName("user-999");

      expect(result).toBeNull();
    });

    test("returns null when memory map is empty", () => {
      const result = getUserName("user-1");

      expect(result).toBeNull();
    });
  });
});
