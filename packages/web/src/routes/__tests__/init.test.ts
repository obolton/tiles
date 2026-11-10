import { beforeEach, describe, expect, test, vi } from "vitest";
import { initRoute } from "../init";
import { user } from "@/utils/sessions";
import { initializeCache } from "@/utils/cache";
import client from "@/api/client";

vi.mock("@/api/client", () => ({
  default: {
    users: { getUserInfo: { query: vi.fn() } },
  },
}));

vi.mock("@/utils/cache", () => ({ initializeCache: vi.fn() }));

const USER = {
  id: "user-1",
  name: "Alice",
  email: "alice@example.com",
  username: "alice",
  imageUrl: null,
  imageKey: null,
  workspaces: [{ id: "workspace-1", name: "Workspace 1" }],
};

beforeEach(() => {
  vi.clearAllMocks();
  user.value = null;
  localStorage.clear();
  vi.spyOn(document, "cookie", "get").mockReturnValue("__Secure-signed-in=1");
  vi.mocked(client.users.getUserInfo.query).mockResolvedValue(USER);
});

describe("initRoute", () => {
  test("initializes the cache with the user provided by the route", () => {
    initRoute("workspace-1", USER);

    expect(initializeCache).toHaveBeenCalledExactlyOnceWith("user-1", "workspace-1");
  });

  test("initializes the cache with the cached user", () => {
    localStorage.setItem("user", JSON.stringify(USER));

    initRoute("workspace-1");

    expect(initializeCache).toHaveBeenCalledExactlyOnceWith("user-1", "workspace-1");
  });

  test("initializes the cache once the user arrives when none is cached", async () => {
    initRoute("workspace-1");
    expect(initializeCache).not.toHaveBeenCalled();

    await vi.waitFor(() => expect(user.value).toEqual(USER));

    expect(initializeCache).toHaveBeenCalledExactlyOnceWith("user-1", "workspace-1");

    // Later changes to the user leave the cache alone
    user.value = { ...USER, name: "Alice B" };
    expect(initializeCache).toHaveBeenCalledTimes(1);
  });

  test("leaves the cache alone for a visitor who is not signed in", async () => {
    vi.spyOn(document, "cookie", "get").mockReturnValue("");

    initRoute("workspace-1");
    await Promise.resolve();

    expect(client.users.getUserInfo.query).not.toHaveBeenCalled();
    expect(initializeCache).not.toHaveBeenCalled();
  });

  test("leaves the cache alone without a workspace", () => {
    initRoute(undefined, USER);

    expect(initializeCache).not.toHaveBeenCalled();
  });
});
