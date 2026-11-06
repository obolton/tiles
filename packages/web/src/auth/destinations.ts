const SEGMENT = "[A-Za-z0-9_-]+";

// Same-origin paths (without the leading slash) that a user may be returned to after signing in
const DESTINATION_PATTERNS = [
  new RegExp(`^invites/(accept|join-workspace)/${SEGMENT}$`),
  new RegExp(`^pages/${SEGMENT}$`),
  new RegExp(`^workspaces/${SEGMENT}(/${SEGMENT}){0,3}$`),
];

export function validateDestination(destination: string) {
  return DESTINATION_PATTERNS.some((pattern) => pattern.test(destination));
}

/** Returns the `destination` query parameter if it is a valid destination. */
export function getDestination(url: URL) {
  const destination = url.searchParams.get("destination");
  return destination && validateDestination(destination) ? destination : null;
}

/** Converts a pathname to a destination if it is a valid one. */
export function getPathDestination(pathname: string) {
  const destination = pathname.replace(/^\//, "");
  return validateDestination(destination) ? destination : null;
}

export function withDestination(path: string, destination: string | null) {
  return destination ? `${path}?destination=${encodeURIComponent(destination)}` : path;
}
