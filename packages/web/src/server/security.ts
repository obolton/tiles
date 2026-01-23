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
  imgSrc: string[];
  connectSrc: string[];
}

export function buildCSPPolicy(sources: CSPSources): CSPPolicy {
  return {
    "default-src": ["'self'"],
    "script-src": ["'self'"],
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    "img-src": ["'self'", "data:", "blob:", ...sources.imgSrc],
    "font-src": ["'self'", "https://fonts.gstatic.com"],
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

function buildSecurityHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };

  if (import.meta.env.PROD) {
    const cspPolicy = buildCSPPolicy({
      imgSrc: [
        import.meta.env.PROFILE_IMAGES_BASE_URL as string,
        import.meta.env.IMAGES_BASE_URL as string,
        import.meta.env.RESOURCES_BASE_URL as string,
      ],
      connectSrc: [
        import.meta.env.PUBLIC_API_ORIGIN as string,
        import.meta.env.PUBLIC_UPLOAD_ORIGIN as string,
      ],
    });

    headers["Content-Security-Policy"] = buildCSPHeader(cspPolicy);
  }

  return headers;
}

export const securityHeaders = buildSecurityHeaders();
