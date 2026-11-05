import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { getHomePageUrl, getPageUrl, getProfileImageUrl, invalidateCachedUrls } from "../cdn";

const { purgeCache } = vi.hoisted(() => ({ purgeCache: vi.fn(async () => {}) }));

vi.mock("@/utils/cloudflare", () => ({ purgeCache }));

// NODE_ENV is read when the env registry loads, so production tests evaluate the module afresh.
async function loadInProduction() {
  vi.stubEnv("NODE_ENV", "production");
  vi.resetModules();
  return import("../cdn");
}

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

  describe("in production", () => {
    let cdn: typeof import("../cdn");

    beforeEach(async () => {
      cdn = await loadInProduction();
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    test("does nothing when there are no URLs", () => {
      cdn.invalidateCachedUrls([]);

      expect(purgeCache).not.toHaveBeenCalled();
    });

    test("purges the URLs", () => {
      const urls = [
        "https://test.example.com/pages/page-1",
        "https://test.example.com/pages/page-2",
      ];

      cdn.invalidateCachedUrls(urls);

      expect(purgeCache).toHaveBeenCalledExactlyOnceWith({ files: urls });
    });

    test("logs purge failures without throwing", async () => {
      const error = new Error("Cloudflare cache purge failed");
      purgeCache.mockRejectedValueOnce(error);
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const urls = ["https://test.example.com/pages/page-1"];

      expect(() => cdn.invalidateCachedUrls(urls)).not.toThrow();

      await vi.waitFor(() => {
        expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
          "Failed to invalidate cached URLs:",
          urls,
          error,
        );
      });
    });
  });
});

describe("invalidateCachedPages", () => {
  let cdn: typeof import("../cdn");

  beforeEach(async () => {
    cdn = await loadInProduction();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("purges the URL of each page", () => {
    cdn.invalidateCachedPages(["page-1", "page-2"]);

    expect(purgeCache).toHaveBeenCalledExactlyOnceWith({
      files: ["https://test.example.com/pages/page-1", "https://test.example.com/pages/page-2"],
    });
  });

  test("does nothing when there are no pages", () => {
    cdn.invalidateCachedPages([]);

    expect(purgeCache).not.toHaveBeenCalled();
  });

  test("also purges the home page URL when the home page changes", () => {
    cdn.invalidateCachedPages(["page-1", "home-page"]);

    expect(purgeCache).toHaveBeenCalledExactlyOnceWith({
      files: [
        "https://test.example.com/pages/page-1",
        "https://test.example.com/pages/home-page",
        "https://test.example.com/",
      ],
    });
  });

  test("does not purge the home page URL when other pages change", () => {
    cdn.invalidateCachedPages(["page-1"]);

    expect(purgeCache).toHaveBeenCalledExactlyOnceWith({
      files: ["https://test.example.com/pages/page-1"],
    });
  });
});
