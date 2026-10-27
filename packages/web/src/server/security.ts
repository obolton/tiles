import assert from "node:assert";

const API_ORIGIN = import.meta.env.PUBLIC_API_ORIGIN;
const UPLOAD_ORIGIN = import.meta.env.PUBLIC_UPLOAD_ORIGIN;
const COLLABORATION_URL = import.meta.env.PUBLIC_COLLABORATION_URL;
const FONTS_BASE_URL = import.meta.env.PUBLIC_FONTS_BASE_URL;
const IMAGES_BASE_URL = import.meta.env.PUBLIC_IMAGES_BASE_URL;
const PROFILE_IMAGES_BASE_URL = import.meta.env.PUBLIC_PROFILE_IMAGES_BASE_URL;

assert(API_ORIGIN, "PUBLIC_API_ORIGIN is not set");
assert(UPLOAD_ORIGIN, "PUBLIC_UPLOAD_ORIGIN is not set");
assert(COLLABORATION_URL, "PUBLIC_COLLABORATION_URL is not set");
assert(FONTS_BASE_URL, "PUBLIC_FONTS_BASE_URL is not set");
assert(IMAGES_BASE_URL, "PUBLIC_IMAGES_BASE_URL is not set");
assert(PROFILE_IMAGES_BASE_URL, "PUBLIC_PROFILE_IMAGES_BASE_URL is not set");

type CSPDirective =
  | "default-src"
  | "script-src"
  | "style-src"
  | "img-src"
  | "font-src"
  | "connect-src"
  | "frame-src"
  | "frame-ancestors"
  | "object-src"
  | "base-uri"
  | "form-action"
  | "upgrade-insecure-requests";

export type CSPPolicy = Partial<Record<CSPDirective, string[]>>;

export function buildCSPHeader(policy: CSPPolicy): string {
  return Object.entries(policy)
    .map(([directive, sources]) =>
      sources.length > 0 ? `${directive} ${sources.join(" ")}` : directive,
    )
    .join("; ");
}

export interface CSPSources {
  fontSrc: string[];
  imgSrc: string[];
  connectSrc: string[];
}

export function buildCSPPolicy(sources: CSPSources): CSPPolicy {
  return {
    "default-src": ["'self'"],
    "script-src": ["'self'"],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", ...sources.imgSrc],
    "font-src": ["'self'", ...sources.fontSrc],
    "connect-src": [
      "'self'",
      "https://oauth2.googleapis.com",
      "https://www.googleapis.com",
      "https://api.maptiler.com",
      ...sources.connectSrc,
    ],
    "frame-src": ["'self'", "https://www.youtube.com"],
    "frame-ancestors": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "upgrade-insecure-requests": [],
  };
}

// A CSP source with a path only matches that exact path, so use the origin.
function getOrigin(url: string): string {
  return new URL(url).origin;
}

export function buildCSPSources(): CSPSources {
  return {
    fontSrc: [getOrigin(FONTS_BASE_URL)],
    imgSrc: [getOrigin(IMAGES_BASE_URL), getOrigin(PROFILE_IMAGES_BASE_URL)],
    connectSrc: [getOrigin(API_ORIGIN), getOrigin(UPLOAD_ORIGIN), getOrigin(COLLABORATION_URL)],
  };
}

function buildSecurityHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };

  if (import.meta.env.PROD) {
    headers["Content-Security-Policy"] = buildCSPHeader(buildCSPPolicy(buildCSPSources()));
  }

  return headers;
}

export const securityHeaders = buildSecurityHeaders();
