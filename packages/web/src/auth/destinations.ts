/**
 * Validates a destination URL or path for OAuth redirects.
 *
 * For security, this function validates that the destination is either:
 * 1. A relative path matching allowed patterns (e.g., invite acceptance)
 * 2. An absolute URL to a trusted local development origin
 *
 * Trusted local origins are used to support multi-instance local development,
 * where different branches run on different subdomains (e.g., foo.localhost:5173).
 */

const ALLOWED_PATH_PATTERNS = [/^invites\/accept\/[A-Za-z0-9_-]+$/];

const TRUSTED_LOCAL_ORIGINS = [
  // Matches *.localhost with any port
  /^https?:\/\/([a-z0-9-]+\.)?localhost(:\d+)?$/,
];

export function validateDestination(destination: string): boolean {
  // Check if it's a relative path matching allowed patterns
  for (const pattern of ALLOWED_PATH_PATTERNS) {
    if (pattern.test(destination)) {
      return true;
    }
  }

  // Check if it's a trusted local origin (for multi-instance local dev)
  // Must be origin-only (no path, query, or fragment) for security
  try {
    const url = new URL(destination);
    // Ensure the destination is exactly an origin (no path beyond "/", no query, no fragment)
    if (url.pathname !== "/" || url.search !== "" || url.hash !== "") {
      return false;
    }
    const origin = url.origin;
    for (const pattern of TRUSTED_LOCAL_ORIGINS) {
      if (pattern.test(origin)) {
        return true;
      }
    }
  } catch {
    // Not a valid URL, and didn't match path patterns
  }

  return false;
}

/**
 * Checks if a destination is an absolute URL (as opposed to a relative path).
 */
export function isAbsoluteUrl(destination: string): boolean {
  try {
    new URL(destination);
    return true;
  } catch {
    return false;
  }
}
