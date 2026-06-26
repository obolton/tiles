import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import {
  user,
  getSessionId,
  isSignedIn,
  getUserInfo,
  initializeSession,
  signOut,
} from "../sessions";
import client from "@/api/client";

vi.mock("@/api/client", () => ({
  default: {
    users: { getUserInfo: { query: vi.fn() } },
    auth: { signOut: { mutate: vi.fn() } },
  },
}));

const mockUser = {
  id: "user-1",
  name: "Alice",
  email: "alice@example.com",
  username: "alice",
  imageUrl: "https://example.com/alice.jpg",
  imageKey: null,
  workspaces: [{ id: "ws-1", name: "Workspace 1" }],
};

beforeEach(() => {
  vi.clearAllMocks();
  user.value = null;
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getSessionId", () => {
  test("extracts the session cookie from headers", () => {
    const headers = new Headers({
      cookie: "__Secure-session=abc123; other=xyz",
    });
    expect(getSessionId(headers)).toBe("abc123");
  });

  test("returns null when no session cookie exists", () => {
    const headers = new Headers({ cookie: "other=xyz" });
    expect(getSessionId(headers)).toBe(null);
  });

  test("returns null when no cookies at all", () => {
    const headers = new Headers();
    expect(getSessionId(headers)).toBe(null);
  });
});

describe("isSignedIn", () => {
  test("returns true when signed-in cookie is 1", () => {
    vi.spyOn(document, "cookie", "get").mockReturnValue("__Secure-signed-in=1");
    expect(isSignedIn()).toBe(true);
  });

  test("returns false when signed-in cookie is missing", () => {
    vi.spyOn(document, "cookie", "get").mockReturnValue("");
    expect(isSignedIn()).toBe(false);
  });

  test("returns false when signed-in cookie has a different value", () => {
    vi.spyOn(document, "cookie", "get").mockReturnValue("__Secure-signed-in=0");
    expect(isSignedIn()).toBe(false);
  });
});

describe("getUserInfo", () => {
  test("fetches user info and sets the reactive store", async () => {
    vi.mocked(client.users.getUserInfo.query).mockResolvedValueOnce(mockUser);

    await getUserInfo();

    expect(user.value).toEqual(mockUser);
  });

  test("caches user info in localStorage", async () => {
    vi.mocked(client.users.getUserInfo.query).mockResolvedValueOnce(mockUser);

    await getUserInfo();

    expect(JSON.parse(localStorage.getItem("user")!)).toEqual(mockUser);
  });

  test("clears user store and cache on error", async () => {
    user.value = mockUser;
    localStorage.setItem("user", JSON.stringify(mockUser));
    vi.mocked(client.users.getUserInfo.query).mockRejectedValueOnce(new Error("Unauthorized"));

    await expect(getUserInfo()).rejects.toThrow("Unauthorized");

    expect(user.value).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  test("handles localStorage being unavailable on success", async () => {
    vi.mocked(client.users.getUserInfo.query).mockResolvedValueOnce(mockUser);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });

    await getUserInfo();

    expect(user.value).toEqual(mockUser);
  });

  test("handles localStorage being unavailable on error", async () => {
    vi.mocked(client.users.getUserInfo.query).mockRejectedValueOnce(new Error("Unauthorized"));
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });

    await expect(getUserInfo()).rejects.toThrow("Unauthorized");

    expect(user.value).toBeNull();
  });
});

describe("initializeSession", () => {
  describe("with user data", () => {
    test("sets the reactive store directly", () => {
      initializeSession(mockUser);

      expect(user.value).toEqual(mockUser);
    });

    test("caches user data in localStorage", () => {
      initializeSession(mockUser);

      expect(JSON.parse(localStorage.getItem("user")!)).toEqual(mockUser);
    });

    test("does not call the API", () => {
      initializeSession(mockUser);

      expect(client.users.getUserInfo.query).not.toHaveBeenCalled();
    });
  });

  describe("when not signed in", () => {
    beforeEach(() => {
      vi.spyOn(document, "cookie", "get").mockReturnValue("");
    });

    test("does not set the user store", () => {
      initializeSession();

      expect(user.value).toBeNull();
    });

    test("does not call the API", () => {
      initializeSession();

      expect(client.users.getUserInfo.query).not.toHaveBeenCalled();
    });
  });

  describe("when signed in", () => {
    beforeEach(() => {
      vi.spyOn(document, "cookie", "get").mockReturnValue("__Secure-signed-in=1");
    });

    test("loads cached user from localStorage", () => {
      localStorage.setItem("user", JSON.stringify(mockUser));
      vi.mocked(client.users.getUserInfo.query).mockResolvedValueOnce(mockUser);

      initializeSession();

      expect(user.value).toEqual(mockUser);
    });

    test("starts a background refresh", () => {
      vi.mocked(client.users.getUserInfo.query).mockResolvedValueOnce(mockUser);

      initializeSession();

      expect(client.users.getUserInfo.query).toHaveBeenCalled();
    });

    test("user is null before background refresh resolves when no cache", () => {
      vi.mocked(client.users.getUserInfo.query).mockResolvedValueOnce(mockUser);

      initializeSession();

      expect(user.value).toBeNull();
    });

    test("background refresh updates user store when it resolves", async () => {
      vi.mocked(client.users.getUserInfo.query).mockResolvedValueOnce(mockUser);

      initializeSession();

      await vi.waitFor(() => expect(user.value).toEqual(mockUser));
    });

    test("handles background refresh failure gracefully", async () => {
      vi.mocked(client.users.getUserInfo.query).mockRejectedValueOnce(new Error("Network error"));

      initializeSession();

      await vi.waitFor(() => expect(client.users.getUserInfo.query).toHaveBeenCalled());
      expect(user.value).toBeNull();
    });
  });
});

describe("signOut", () => {
  let location: { href: string };

  beforeEach(() => {
    vi.mocked(client.auth.signOut.mutate).mockResolvedValueOnce(null);
    location = { href: "" };
    vi.stubGlobal("location", location);
  });

  test("calls the sign-out API", async () => {
    await signOut();

    expect(client.auth.signOut.mutate).toHaveBeenCalled();
  });

  test("clears storage", async () => {
    localStorage.setItem("user", "test");
    sessionStorage.setItem("key", "test");

    await signOut();

    expect(localStorage.getItem("user")).toBeNull();
    expect(sessionStorage.getItem("key")).toBeNull();
  });

  test("clears the signed-in cookie", async () => {
    const cookieSetter = vi.spyOn(document, "cookie", "set");

    await signOut();

    expect(cookieSetter).toHaveBeenCalledWith(expect.stringContaining("Max-Age=0"));
  });

  test("redirects to the home page", async () => {
    await signOut();

    expect(location.href).toBe("/");
  });
});
