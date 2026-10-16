import { describe, expect, test } from "vitest";
import {
  buildCSPHeader,
  buildCSPPolicy,
  buildCSPSources,
  buildSecurityHeaders,
  securityHeaders,
  type CSPEnv,
  type CSPPolicy,
} from "../security";

describe("buildCSPHeader", () => {
  test("formats a single directive with sources", () => {
    const policy: CSPPolicy = {
      "default-src": ["'self'"],
    };
    expect(buildCSPHeader(policy)).toBe("default-src 'self'");
  });

  test("formats multiple sources with spaces", () => {
    const policy: CSPPolicy = {
      "img-src": ["'self'", "data:", "https://example.com"],
    };
    expect(buildCSPHeader(policy)).toBe("img-src 'self' data: https://example.com");
  });

  test("separates multiple directives with semicolons", () => {
    const policy: CSPPolicy = {
      "default-src": ["'self'"],
      "script-src": ["'self'"],
    };
    expect(buildCSPHeader(policy)).toBe("default-src 'self'; script-src 'self'");
  });

  test("handles directives with no sources", () => {
    const policy: CSPPolicy = {
      "upgrade-insecure-requests": [],
    };
    expect(buildCSPHeader(policy)).toBe("upgrade-insecure-requests");
  });

  test("combines directives with and without sources", () => {
    const policy: CSPPolicy = {
      "default-src": ["'self'"],
      "upgrade-insecure-requests": [],
    };
    expect(buildCSPHeader(policy)).toBe("default-src 'self'; upgrade-insecure-requests");
  });

  test("handles empty policy", () => {
    const policy: CSPPolicy = {};
    expect(buildCSPHeader(policy)).toBe("");
  });
});

describe("buildCSPPolicy", () => {
  const testSources = {
    fontSrc: ["https://fonts.example.com"],
    imgSrc: ["https://images.example.com", "https://profiles.example.com"],
    connectSrc: ["https://api.example.com"],
  };

  test("default-src allows only self", () => {
    const policy = buildCSPPolicy(testSources);
    expect(policy["default-src"]).toEqual(["'self'"]);
  });

  test("script-src allows only self", () => {
    const policy = buildCSPPolicy(testSources);
    expect(policy["script-src"]).toEqual(["'self'"]);
  });

  test("style-src allows self and inline styles", () => {
    const policy = buildCSPPolicy(testSources);
    expect(policy["style-src"]).toEqual(["'self'", "'unsafe-inline'"]);
  });

  test("img-src includes base sources and custom URLs", () => {
    const policy = buildCSPPolicy(testSources);
    expect(policy["img-src"]).toEqual([
      "'self'",
      "data:",
      "blob:",
      "https://images.example.com",
      "https://profiles.example.com",
    ]);
  });

  test("font-src includes self and custom font URLs", () => {
    const policy = buildCSPPolicy(testSources);
    expect(policy["font-src"]).toEqual(["'self'", "https://fonts.example.com"]);
  });

  test("connect-src includes base services and custom URLs", () => {
    const policy = buildCSPPolicy(testSources);
    expect(policy["connect-src"]).toEqual([
      "'self'",
      "https://oauth2.googleapis.com",
      "https://www.googleapis.com",
      "https://api.maptiler.com",
      "https://api.example.com",
    ]);
  });

  test("frame-src allows self and YouTube", () => {
    const policy = buildCSPPolicy(testSources);
    expect(policy["frame-src"]).toEqual(["'self'", "https://www.youtube.com"]);
  });

  test("frame-ancestors allows only self", () => {
    const policy = buildCSPPolicy(testSources);
    expect(policy["frame-ancestors"]).toEqual(["'self'"]);
  });

  test("object-src blocks all objects", () => {
    const policy = buildCSPPolicy(testSources);
    expect(policy["object-src"]).toEqual(["'none'"]);
  });

  test("base-uri allows only self", () => {
    const policy = buildCSPPolicy(testSources);
    expect(policy["base-uri"]).toEqual(["'self'"]);
  });

  test("form-action allows only self", () => {
    const policy = buildCSPPolicy(testSources);
    expect(policy["form-action"]).toEqual(["'self'"]);
  });

  test("upgrade-insecure-requests is enabled", () => {
    const policy = buildCSPPolicy(testSources);
    expect(policy["upgrade-insecure-requests"]).toEqual([]);
  });

  test("handles empty custom sources", () => {
    const policy = buildCSPPolicy({ fontSrc: [], imgSrc: [], connectSrc: [] });
    expect(policy["img-src"]).toEqual(["'self'", "data:", "blob:"]);
    expect(policy["font-src"]).toEqual(["'self'"]);
    expect(policy["connect-src"]).toEqual([
      "'self'",
      "https://oauth2.googleapis.com",
      "https://www.googleapis.com",
      "https://api.maptiler.com",
    ]);
  });

  test("produces a valid CSP header string", () => {
    const policy = buildCSPPolicy(testSources);
    const header = buildCSPHeader(policy);

    expect(header).not.toMatch(/  /); // No double spaces
    expect(header).not.toMatch(/; ;/); // No empty directives
    expect(header).not.toMatch(/^;/); // Doesn't start with semicolon
    expect(header).not.toMatch(/;$/); // Doesn't end with semicolon
  });
});

describe("securityHeaders", () => {
  test("includes X-Content-Type-Options header", () => {
    expect(securityHeaders["X-Content-Type-Options"]).toBe("nosniff");
  });

  test("includes Referrer-Policy header", () => {
    expect(securityHeaders["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
  });
});

const PRODUCTION_ENV: CSPEnv = {
  PUBLIC_API_ORIGIN: "https://api.example.com",
  PUBLIC_UPLOAD_ORIGIN: "https://uploads.example.com",
  PUBLIC_COLLABORATION_URL: "wss://api.example.com/collaboration",
  PUBLIC_FONTS_BASE_URL: "https://cdn.example.com/fonts",
  PUBLIC_IMAGES_BASE_URL: "https://cdn.example.com/images",
  PUBLIC_PROFILE_IMAGES_BASE_URL: "https://cdn.example.com/profile-images",
};

describe("buildCSPSources", () => {
  test("reduces base URLs to their origins and dedupes them", () => {
    const sources = buildCSPSources(PRODUCTION_ENV);
    expect(sources.fontSrc).toEqual(["https://cdn.example.com"]);
    expect(sources.imgSrc).toEqual(["https://cdn.example.com"]);
  });

  test("includes the collaboration WebSocket origin in connect-src", () => {
    const sources = buildCSPSources(PRODUCTION_ENV);
    expect(sources.connectSrc).toEqual([
      "https://api.example.com",
      "https://uploads.example.com",
      "wss://api.example.com",
    ]);
  });

  test("keeps a collaboration origin that differs from the API origin", () => {
    const sources = buildCSPSources({
      ...PRODUCTION_ENV,
      PUBLIC_COLLABORATION_URL: "wss://collab.example.com/collaboration",
    });
    expect(sources.connectSrc).toContain("wss://collab.example.com");
  });

  test("ignores unset variables", () => {
    const sources = buildCSPSources({});
    expect(sources).toEqual({ fontSrc: [], imgSrc: [], connectSrc: [] });
  });
});

describe("buildSecurityHeaders", () => {
  test("omits the CSP header when disabled", () => {
    const headers = buildSecurityHeaders(PRODUCTION_ENV, false);
    expect(headers["Content-Security-Policy"]).toBeUndefined();
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
  });

  test("renders a CSP header without undefined sources", () => {
    const header = buildSecurityHeaders(PRODUCTION_ENV, true)["Content-Security-Policy"];
    expect(header).toBeDefined();
    expect(header).not.toContain("undefined");
    expect(header).toContain("img-src 'self' data: blob: https://cdn.example.com");
    expect(header).toContain("font-src 'self' https://cdn.example.com");
    expect(header).toContain("wss://api.example.com");
  });
});
