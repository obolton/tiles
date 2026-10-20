import { afterEach, describe, expect, test, vi } from "vitest";
import {
  getHomePageUrl,
  getPageUrl,
  getProfileImageUrl,
  invalidateCachedPages,
  invalidateCachedUrls,
} from "../cdn";

const purgeCache = vi.hoisted(() => vi.fn(async () => {}));

vi.mock("@/utils/cloudflare", () => ({ purgeCache }));

async function loadWithHomePage(homePageId: string) {
  vi.resetModules();
  vi.stubEnv("PAGE_ID", homePageId);
  vi.stubEnv("NODE_ENV", "production");
  return import("@/utils/cdn");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getProfileImageUrl", () => {
  test("returns the profile image URL", () => {
    const result = getProfileImageUrl("image-key");
    expect(result).toBe("https://example.com/profile-images/image-key?optimizer=image&class=small");
  });
});

describe("getHomePageUrl", () => {
  test("returns the client origin root", () => {
    expect(getHomePageUrl()).toBe("https://test.example.com/");
  });
});

describe("getPageUrl", () => {
  test("returns the client URL for a page", () => {
    expect(getPageUrl("page-1")).toBe("https://test.example.com/pages/page-1");
  });
});

describe("invalidateCachedUrls", () => {
  test("does nothing outside production", () => {
    invalidateCachedUrls(["https://test.example.com/pages/page-1"]);

    expect(purgeCache).not.toHaveBeenCalled();
  });

  test("does nothing when there are no URLs", () => {
    vi.stubEnv("NODE_ENV", "production");

    invalidateCachedUrls([]);

    expect(purgeCache).not.toHaveBeenCalled();
  });

  test("purges the URLs in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const urls = ["https://test.example.com/pages/page-1", "https://test.example.com/pages/page-2"];

    invalidateCachedUrls(urls);

    expect(purgeCache).toHaveBeenCalledExactlyOnceWith({ files: urls });
  });

  test("logs purge failures without throwing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const error = new Error("Cloudflare cache purge failed");
    purgeCache.mockRejectedValueOnce(error);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const urls = ["https://test.example.com/pages/page-1"];

    expect(() => invalidateCachedUrls(urls)).not.toThrow();

    await vi.waitFor(() => {
      expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
        "Failed to invalidate cached URLs:",
        urls,
        error,
      );
    });
  });
});

describe("invalidateCachedPages", () => {
  test("purges the URL of each page", () => {
    vi.stubEnv("NODE_ENV", "production");

    invalidateCachedPages(["page-1", "page-2"]);

    expect(purgeCache).toHaveBeenCalledExactlyOnceWith({
      files: ["https://test.example.com/pages/page-1", "https://test.example.com/pages/page-2"],
    });
  });

  test("does nothing when there are no pages", () => {
    vi.stubEnv("NODE_ENV", "production");

    invalidateCachedPages([]);

    expect(purgeCache).not.toHaveBeenCalled();
  });

  describe("with a configured home page", () => {
    test("also purges the home page URL when the home page changes", async () => {
      const cdn = await loadWithHomePage("home-page");

      cdn.invalidateCachedPages(["page-1", "home-page"]);

      expect(purgeCache).toHaveBeenCalledExactlyOnceWith({
        files: [
          "https://test.example.com/pages/page-1",
          "https://test.example.com/pages/home-page",
          "https://test.example.com/",
        ],
      });
    });

    test("does not purge the home page URL when other pages change", async () => {
      const cdn = await loadWithHomePage("home-page");

      cdn.invalidateCachedPages(["page-1"]);

      expect(purgeCache).toHaveBeenCalledExactlyOnceWith({
        files: ["https://test.example.com/pages/page-1"],
      });
    });
  });
});
