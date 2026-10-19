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

// CSP source expressions with a path only match that exact path (or prefix if it
// ends in "/"), so reduce each configured URL to its origin.
function toOrigins(urls: (string | undefined)[]): string[] {
  const origins = new Set<string>();
  for (const url of urls) {
    if (url) {
      origins.add(new URL(url).origin);
    }
  }
  return [...origins];
}

export function buildCSPSources(): CSPSources {
  return {
    fontSrc: toOrigins([import.meta.env.PUBLIC_FONTS_BASE_URL]),
    imgSrc: toOrigins([
      import.meta.env.PUBLIC_IMAGES_BASE_URL,
      import.meta.env.PUBLIC_PROFILE_IMAGES_BASE_URL,
    ]),
    connectSrc: toOrigins([
      import.meta.env.PUBLIC_API_ORIGIN,
      import.meta.env.PUBLIC_UPLOAD_ORIGIN,
      import.meta.env.PUBLIC_COLLABORATION_URL,
    ]),
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
